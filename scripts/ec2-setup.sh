#!/bin/bash

#############################################
# EC2 Instance Setup Script for KAPPY Project
#############################################

# HOW TO USE THIS SCRIPT:
# 1. Launch an EC2 instance in AWS Console
# 2. Choose "Amazon Linux 2" as the AMI
# 3. In "Advanced Details" > "User data", paste this entire script
# 4. After instance launches, connect via EC2 Instance Connect
# 5. Navigate to /home/ec2-user/app/CloudProj1
# 6. Edit the .env file with your actual values
#############################################

echo "Starting EC2 setup for KAPPY project..."

#############################################
# System Updates and Dependencies
#############################################

echo "Updating system and installing dependencies..."
# Update system packages
sudo yum update -y

# Install required packages
sudo yum install -y git                    # For cloning repository
sudo yum install -y mysql                  # MySQL client for database operations

# Install Node.js 16.x (newer version for better performance)
echo "Installing Node.js 16.x..."
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

#############################################
# Application Setup
#############################################

echo "Setting up application directory..."
# Create and navigate to application directory
cd /home/ec2-user
mkdir -p app
cd app

# Clone the project repository
echo "Cloning project repository..."
git clone https://github.com/ljh0311/CloudProj1.git
cd CloudProj1

#############################################
# Dependencies Installation
#############################################

echo "Installing project dependencies..."
# Install project dependencies
npm install

# Install MySQL2 for database operations
npm install mysql2

#############################################
# Environment Configuration
#############################################

echo "Creating environment configuration..."
# Create .env file with placeholder values
cat > .env << EOF
#======================================
# Database Configuration
#======================================
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=your_rds_username
DB_PASSWORD=your_rds_password
DB_NAME=kappy_db

#======================================
# Application Configuration
#======================================
NODE_ENV=production
PORT=3000

#======================================
# Authentication Configuration
#======================================
# Replace your_ec2_public_ip with your actual EC2 public IP
NEXTAUTH_URL=http://your_ec2_public_ip:3000
NEXTAUTH_SECRET=your_generated_secret

#======================================
# API Configuration
#======================================
NEXT_PUBLIC_API_URL=http://your_ec2_public_ip:3000/api
EOF

#############################################
# Process Manager Setup (PM2)
#############################################

echo "Setting up PM2 process manager..."
# Install PM2 globally
sudo npm install -g pm2

# Build the application
echo "Building the application..."
npm run build

# Start the application with PM2
pm2 start npm --name "kappy" -- start

# Configure PM2 to start on system reboot
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

#############################################
# Database Migration
#############################################

echo "Starting database migration..."
# Run the database migration script
node scripts/migrate-to-rds.js

#############################################
# Setup Complete
#############################################

echo """
==============================================
SETUP COMPLETE! NEXT STEPS:
==============================================
1. Edit your environment variables:
   nano /home/ec2-user/app/CloudProj1/.env

2. Update these values in .env:
   - DB_HOST (Your RDS endpoint)
   - DB_USER (Your RDS username)
   - DB_PASSWORD (Your RDS password)
   - NEXTAUTH_URL (Your EC2 public IP)
   - NEXT_PUBLIC_API_URL (Your EC2 public IP)

3. Restart the application:
   pm2 restart kappy

4. Check application status:
   pm2 status
   pm2 logs kappy

5. Verify database migration:
   mysql -h your-rds-endpoint -u your-username -p

==============================================
""" 