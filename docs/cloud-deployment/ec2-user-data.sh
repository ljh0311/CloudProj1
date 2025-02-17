#!/bin/bash

#=========================================================
# EC2 User Data Script for KAPPY E-commerce Setup
# 
# HOW TO USE:
# 1. Replace the following variables with your values:
#    - RDS_ENDPOINT
#    - RDS_PASSWORD
#    - EC2_PUBLIC_IP
#    - NEXTAUTH_SECRET
# 2. Copy this entire script
# 3. When launching EC2:
#    - Expand "Advanced details"
#    - Scroll to "User data"
#    - Paste this script
#=========================================================

#---------------------------------------------------------
# Configuration Variables - EDIT THESE VALUES
#---------------------------------------------------------
RDS_ENDPOINT="database1.xxxxxxxxxxxx.ap-southeast-2.rds.amazonaws.com"  # Your RDS endpoint
RDS_PASSWORD="your-password-here"                                       # Your RDS password
EC2_PUBLIC_IP="3.26.102.46"                                           # Your EC2 public IP
NEXTAUTH_SECRET="your-secret-here"                                     # Generate a secure secret

#---------------------------------------------------------
# System Updates and Software Installation
#---------------------------------------------------------
echo "Starting system setup..."

# Update system packages
yum update -y

# Install required software
yum install -y git nodejs npm mysql

# Install PM2 globally
npm install -g pm2

#---------------------------------------------------------
# Application Directory Setup
#---------------------------------------------------------
echo "Setting up application directory..."

# Create and configure app directory
cd /home/ec2-user
mkdir -p app
chown ec2-user:ec2-user app
cd app

# Clone repository
git clone https://github.com/ljh0311/CloudProj1.git
cd CloudProj1
chown -R ec2-user:ec2-user .

#---------------------------------------------------------
# Environment Configuration
#---------------------------------------------------------
echo "Configuring environment..."

# Create .env file
cat > .env << EOF
# Database Configuration
DB_HOST=${RDS_ENDPOINT}
DB_USER=admin
DB_PASSWORD=${RDS_PASSWORD}
DB_NAME=kappy_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Authentication Configuration
NEXTAUTH_URL=http://${EC2_PUBLIC_IP}:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# API Configuration
NEXT_PUBLIC_API_URL=http://${EC2_PUBLIC_IP}:3000/api
EOF

# Set correct permissions for .env
chmod 600 .env
chown ec2-user:ec2-user .env

#---------------------------------------------------------
# Application Setup
#---------------------------------------------------------
echo "Setting up application..."

# Switch to ec2-user for npm commands
su - ec2-user << 'EOF'
cd /home/ec2-user/app/CloudProj1

# Install dependencies
npm install

# Build application
npm run build

# Start application with PM2
pm2 start npm --name "kappy" -- start

# Save PM2 process list
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
EOF

#---------------------------------------------------------
# Status Check
#---------------------------------------------------------
echo "Checking setup status..."

# Create status page
cat > /home/ec2-user/app/CloudProj1/setup-status.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>KAPPY - Setup Status</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: #28a745; }
        .info { color: #17a2b8; }
    </style>
</head>
<body>
    <h1>🎉 KAPPY Setup Complete!</h1>
    <p class="success">Your EC2 instance has been successfully configured.</p>
    <h2>Configuration Details:</h2>
    <ul>
        <li>Application URL: http://${EC2_PUBLIC_IP}:3000</li>
        <li>API Endpoint: http://${EC2_PUBLIC_IP}:3000/api</li>
        <li>Database: ${RDS_ENDPOINT}</li>
    </ul>
    <p class="info">If you can see this page, your server is running!</p>
</body>
</html>
EOF

# Log completion
echo "Setup completed at $(date)" >> /var/log/kappy-setup.log

#---------------------------------------------------------
# Final Instructions
#---------------------------------------------------------
echo """
==============================================
SETUP COMPLETE! NEXT STEPS:
==============================================
1. Wait 3-5 minutes for all services to start

2. Test your application:
   http://${EC2_PUBLIC_IP}:3000

3. If needed, check logs:
   pm2 logs kappy

4. Common commands:
   - View status: pm2 status
   - Restart app: pm2 restart kappy
   - View logs: pm2 logs kappy
==============================================
""" 