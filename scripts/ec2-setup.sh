#!/bin/bash

#############################################
# EC2 Instance Setup Script for KAPPY Project
#############################################

# HOW TO USE THIS SCRIPT:
# 1. Launch an EC2 instance in AWS Console:
#    a. Go to AWS Console > EC2 > Launch Instance
#    b. Enter a name for your instance
#    c. Select instance type (t2.micro recommended for testing)
#
# 2. Choose "Amazon Linux 2" as the AMI:
#    a. In the AMI selection screen, select "Amazon Linux 2 AMI (HVM)"
#    b. Make sure it shows "Free tier eligible" if needed
#
# 3. Configure User Data:
#    a. Scroll down to "Advanced Details" section
#    b. Find "User data" text area
#    c. Copy this entire script
#    d. Paste the script into the User data field
#
# 4. Connect to your instance:
#    a. Wait 3-5 minutes for instance to fully initialize
#    b. Go to EC2 Dashboard > Instances
#    c. Select your instance
#    d. Click "Connect" button
#    e. Choose "EC2 Instance Connect" tab
#    f. Click "Connect" to open terminal
#
# 5. Navigate to application directory:
#    a. In the terminal, type: cd /home/ec2-user/app/CloudProj1
#    b. Verify files with: ls
#
# 6. Configure environment variables:
#    a. Open .env file: nano .env
#    b. Update following values:
#       - DB_HOST=<your RDS endpoint>
#       - DB_USER=<your database username>
#       - DB_PASSWORD=<your database password>
#       - DB_NAME=<your database name>
#    c. Save file: Ctrl+X, then Y, then Enter
#############################################

echo "Starting EC2 setup for KAPPY project..."

#############################################
# System Updates and Dependencies
#############################################

echo "Updating system and installing dependencies..."
# Update system packages
yum update -y

# Install required packages
yum install -y git                    # For cloning repository
yum install -y mysql                  # MySQL client for database operations

# Install Node.js 16.x (newer version for better performance)
echo "Installing Node.js 16.x..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
yum install -y nodejs

#############################################
# Application Setup
#############################################

echo "Setting up application directory..."
# Create and navigate to application directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

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
DB_HOST=your-rds-endpoint
DB_USER=admin
DB_PASSWORD=your-password
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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

#======================================
# API Configuration
#======================================
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF

#############################################
# Process Manager Setup (PM2)
#############################################

echo "Setting up PM2 process manager..."
# Install PM2 globally
npm install -g pm2

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

# Set permissions for .env
chmod 600 /home/ec2-user/app/.env
chown ec2-user:ec2-user /home/ec2-user/app/.env

# Create a status page
cat > /home/ec2-user/app/status.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>EC2 Setup Status</title>
</head>
<body>
    <h1>EC2 Setup Complete</h1>
    <p>Your EC2 instance has been initialized successfully.</p>
</body>
</html>
EOL

# Set up application log
touch /var/log/kappy-setup.log
chown ec2-user:ec2-user /var/log/kappy-setup.log

# Log completion
echo "EC2 setup completed at $(date)" >> /var/log/kappy-setup.log 