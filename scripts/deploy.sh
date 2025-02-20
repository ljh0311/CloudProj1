#!/bin/bash

#=========================================================
# Deployment Script for KAPPY E-commerce
#=========================================================

set -e # Exit on error

echo "🚀 Starting deployment process..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "❌ Please run as non-root user"
    exit 1
fi

# Navigate to application directory
cd /home/ec2-user/app/CloudProj1

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# System checks
echo "🔍 Checking system resources..."
free -h
df -h

# Clear npm cache and remove node_modules
echo "🧹 Cleaning up..."
npm cache clean --force
rm -rf node_modules package-lock.json .next

# Create swap space if not exists
if [ ! -f /swapfile ]; then
    echo "📝 Creating swap space..."
    sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Install dependencies in chunks
echo "📦 Installing dependencies..."
export NODE_OPTIONS="--max-old-space-size=512"
export HUSKY=0

# Install production dependencies in smaller chunks
echo "Installing core dependencies..."
npm install --no-package-lock --production next react react-dom

echo "Installing UI dependencies..."
npm install --no-package-lock --production @chakra-ui/react @emotion/react @emotion/styled framer-motion

echo "Installing authentication dependencies..."
npm install --no-package-lock --production next-auth bcryptjs

echo "Installing database dependencies..."
npm install --no-package-lock --production mysql2

echo "Installing utility dependencies..."
npm install --no-package-lock --production uuid dotenv

# Build application with memory optimization
echo "🏗️ Building application..."
NODE_OPTIONS="--max-old-space-size=512" npm run build

# Stop any existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 delete all || true
sleep 2

# Clear PM2 logs
echo "🧹 Clearing PM2 logs..."
pm2 flush

# Start the application with PM2 (single instance for t2.micro)
echo "🔄 Starting application with PM2..."
export HOST=0.0.0.0
export PORT=3000
pm2 delete all || true
pm2 start npm --name "kappy" --node-args="--max-old-space-size=512" -- start
pm2 save

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 15

# Check PM2 status
echo "📊 PM2 Status:"
pm2 list
echo "📋 Recent Logs:"
pm2 logs --lines 20 --nostream

# Check if the process is running
if ! pm2 pid kappy > /dev/null; then
    echo "❌ Process failed to start"
    echo "📋 Last few lines of logs:"
    pm2 logs --lines 50
    exit 1
fi

# Health check with retries
echo "🏥 Running health check..."
max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
    echo "Health check attempt $attempt of $max_attempts..."
    response=$(curl -s http://44.201.154.170:3000/api/health)
    if [ $? -eq 0 ]; then
        echo "Response: $response"
        if echo "$response" | grep -q '"status":"healthy"'; then
            echo "✅ Health check passed!"
            break
        fi
    fi
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Health check failed after $max_attempts attempts"
        echo "📋 Last few lines of logs:"
        pm2 logs --lines 50
        echo "Process status:"
        pm2 describe kappy
        echo "Network status:"
        netstat -tulpn | grep 3000
        exit 1
    fi
    echo "Waiting before next attempt..."
    sleep 10
    ((attempt++))
done

echo """
✅ Deployment completed successfully!

Instance Details:
----------------
Instance ID: i-027edf2fe474ed2b2
Public IP: 44.201.154.170
Private IP: 172.31.95.243
Hostname: ip-172-31-95-243.ec2.internal

URLs:
-----
Application: http://44.201.154.170:3000
API: http://44.201.154.170:3000/api
Health Check: http://44.201.154.170:3000/api/health

Monitor with:
------------
PM2 Status: pm2 status
PM2 Logs: pm2 logs kappy
System Resources: htop
""" 