#!/bin/bash

#=========================================================
# EC2 User Data Script for KAPPY E-commerce Setup
# 
# HOW TO USE:
# 1. Replace the following variables with your values:
#    - RDS_ENDPOINT
#    - RDS_PASSWORD
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
RDS_ENDPOINT="database1.czsa24cac7y5.us-east-1.rds.amazonaws.com"  # Your RDS endpoint
RDS_PASSWORD="KappyAdmin"                                          # Your RDS password

# Create a directory for persistent configuration
mkdir -p /home/ec2-user/app/config

# Automatically retrieve and store the EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Retrieved EC2 Public IP: ${EC2_PUBLIC_IP}"

# Store IP in a config file
echo "${EC2_PUBLIC_IP}" > /home/ec2-user/app/config/instance-ip

# Generate and store NEXTAUTH_SECRET if it doesn't exist
if [ ! -f /home/ec2-user/app/config/nextauth-secret ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "${NEXTAUTH_SECRET}" > /home/ec2-user/app/config/nextauth-secret
else
    NEXTAUTH_SECRET=$(cat /home/ec2-user/app/config/nextauth-secret)
fi
echo "Using NEXTAUTH_SECRET from config"

# Validate variables
if [ -z "$EC2_PUBLIC_IP" ]; then
    echo "Error: Failed to retrieve EC2 public IP"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "Error: Failed to get or generate NEXTAUTH_SECRET"
    exit 1
fi

# Set proper permissions for config files
chmod 600 /home/ec2-user/app/config/*
chown -R ec2-user:ec2-user /home/ec2-user/app/config

#---------------------------------------------------------
# System Updates and Software Installation
#---------------------------------------------------------
echo "Starting system setup..."

# Update system packages
sudo yum update -y

# Install git and other essentials
sudo yum install -y git

# Install NVM and Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install and use Node.js 18.18.0 (updated version)
nvm install 18.18.0
nvm use 18.18.0
nvm alias default 18.18.0

# Verify Node.js version
node -v
npm -v

# Install PM2 globally
npm install -g pm2

#---------------------------------------------------------
# Application Directory Setup
#---------------------------------------------------------
echo "Setting up application directory..."

# Create and configure app directory
cd /home/ec2-user
if [ -d "app/CloudProj1" ]; then
    # If directory exists, just update the .env file
    echo "Application directory exists, updating configuration..."
else
    # Create new directory and clone repository
    mkdir -p app
    chown ec2-user:ec2-user app
    cd app
    git clone https://github.com/ljh0311/CloudProj1.git
    cd CloudProj1
    chown -R ec2-user:ec2-user .
fi

#---------------------------------------------------------
# Environment Configuration
#---------------------------------------------------------
echo "Configuring environment..."

# Create or update .env file with evaluated IP address
cat > /home/ec2-user/app/CloudProj1/.env << EOF
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

# Security Configuration
SECURE_COOKIES=true
SESSION_SECRET=${NEXTAUTH_SECRET}
EOF

# Verify .env file was created
if [ ! -f /home/ec2-user/app/CloudProj1/.env ]; then
    echo "Error: Failed to create .env file"
    exit 1
fi

# Set correct permissions for .env
chmod 600 /home/ec2-user/app/CloudProj1/.env
chown ec2-user:ec2-user /home/ec2-user/app/CloudProj1/.env

# Display .env contents for verification (excluding sensitive data)
echo "Verifying .env configuration:"
grep -v "PASSWORD\|SECRET" /home/ec2-user/app/CloudProj1/.env

#---------------------------------------------------------
# Application Setup
#---------------------------------------------------------
echo "Setting up application..."

# Switch to ec2-user for npm commands
sudo -u ec2-user bash << EOF
cd /home/ec2-user/app/CloudProj1

# Ensure correct Node.js version
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
nvm use 18.18.0

# Clean install
rm -rf node_modules
rm -rf .next
npm install

# Build application
npm run build

# Stop any running instances
pm2 delete all || true

# Start with PM2
pm2 start npm --name "kappy" -- start
pm2 save

# Setup PM2 startup script
sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save
EOF

#---------------------------------------------------------
# Create IP Update Script
#---------------------------------------------------------
echo "Creating IP update script..."

# Create a script to update IP address
cat > /home/ec2-user/update-ip.sh << 'EOF'
#!/bin/bash

# Get the current EC2 public IP
NEW_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

if [ -z "$NEW_IP" ]; then
    echo "Error: Failed to retrieve EC2 public IP"
    exit 1
fi

# Store the new IP
echo "${NEW_IP}" > /home/ec2-user/app/config/instance-ip

# Get the stored NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(cat /home/ec2-user/app/config/nextauth-secret)

# Update the .env file with the new IP
cat > /home/ec2-user/app/CloudProj1/.env << EOF
# Database Configuration
DB_HOST=database1.czsa24cac7y5.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=KappyAdmin
DB_NAME=kappy_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Authentication Configuration
NEXTAUTH_URL=http://${NEW_IP}:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# API Configuration
NEXT_PUBLIC_API_URL=http://${NEW_IP}:3000/api

# Security Configuration
SECURE_COOKIES=true
SESSION_SECRET=${NEXTAUTH_SECRET}
EOF

echo "Updated IP address to: ${NEW_IP}"

# Rebuild and restart the application
cd /home/ec2-user/app/CloudProj1
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run build
pm2 restart all
EOF

chmod +x /home/ec2-user/update-ip.sh
chown ec2-user:ec2-user /home/ec2-user/update-ip.sh

# Add to crontab to check IP changes
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ec2-user/update-ip.sh >> /home/ec2-user/ip-update.log 2>&1") | crontab -

#---------------------------------------------------------
# Final Status Check
#---------------------------------------------------------
echo "Checking application status..."

# Create status check script
cat > /home/ec2-user/check-status.sh << 'EOF'
#!/bin/bash
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "PM2 status:"
pm2 status
echo "Application logs:"
pm2 logs kappy --lines 20
EOF

chmod +x /home/ec2-user/check-status.sh
chown ec2-user:ec2-user /home/ec2-user/check-status.sh

# Log completion
sudo echo "Setup completed at $(date)" >> /var/log/kappy-setup.log
echo "To check application status, run: ./check-status.sh"

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
   - Check IP updates: tail -f /home/ec2-user/ip-update.log
==============================================
""" 