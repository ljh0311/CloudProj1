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

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build application
echo "🏗️ Building application..."
npm run build

# Restart PM2 processes
echo "🔄 Restarting application..."
pm2 reload kappy || pm2 start npm --name "kappy" -i max --time -- start
pm2 save

# Run health check
echo "🏥 Running health check..."
curl -f http://localhost:3000/api/health || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Deployment completed successfully!" 