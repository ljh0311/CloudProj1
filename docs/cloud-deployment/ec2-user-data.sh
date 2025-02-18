#!/bin/bash

#=========================================================
# EC2 User Data Script for KAPPY E-commerce Setup
# Optimized for t2.micro instance
#=========================================================

set -e # Exit on error

echo "Starting setup at $(date)" > /var/log/kappy-setup.log

#---------------------------------------------------------
# System Configuration
#---------------------------------------------------------
# Configure swap space for t2.micro
echo "Configuring swap space..."
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=128M count=16   # 2GB swap file
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Update system and install dependencies
echo "Updating system packages..."
yum update -y
yum install -y git curl

#---------------------------------------------------------
# Application Directory Setup
#---------------------------------------------------------
echo "Setting up application directory..."
mkdir -p /home/ec2-user/app/config
cd /home/ec2-user

# Get instance IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Retrieved EC2 Public IP: ${EC2_PUBLIC_IP}"
echo "${EC2_PUBLIC_IP}" > /home/ec2-user/app/config/instance-ip

# Generate and store NEXTAUTH_SECRET
if [ ! -f /home/ec2-user/app/config/nextauth-secret ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "${NEXTAUTH_SECRET}" > /home/ec2-user/app/config/nextauth-secret
fi

#---------------------------------------------------------
# Node.js Setup
#---------------------------------------------------------
echo "Setting up Node.js..."
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install 18.18.0
nvm use 18.18.0
nvm alias default 18.18.0

# Install PM2 globally
npm install -g pm2

#---------------------------------------------------------
# Application Setup
#---------------------------------------------------------
echo "Setting up application..."
cd /home/ec2-user/app

# Clone or update repository
if [ -d "CloudProj1" ]; then
    cd CloudProj1
    git fetch origin
    git reset --hard origin/main
else
    git clone https://github.com/ljh0311/CloudProj1.git
    cd CloudProj1
fi

# Set permissions
chown -R ec2-user:ec2-user /home/ec2-user/app

# Create .env file
cat > .env << EOF
# Database Configuration
DB_HOST=database1.czsa24cac7y5.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=KappyAdmin
DB_NAME=kappy_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Authentication Configuration
NEXTAUTH_URL=http://${EC2_PUBLIC_IP}:3000
NEXTAUTH_SECRET=$(cat /home/ec2-user/app/config/nextauth-secret)

# API Configuration
NEXT_PUBLIC_API_URL=http://${EC2_PUBLIC_IP}:3000/api

# Security Configuration
SECURE_COOKIES=true
SESSION_SECRET=$(cat /home/ec2-user/app/config/nextauth-secret)
EOF

chmod 600 .env

#---------------------------------------------------------
# Application Installation and Build
#---------------------------------------------------------
echo "Installing dependencies and building..."
sudo -u ec2-user bash << EOF
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
cd /home/ec2-user/app/CloudProj1

# Clean install
rm -rf node_modules .next package-lock.json
npm cache clean --force

# Install dependencies with specific flags for t2.micro
export NODE_OPTIONS="--max-old-space-size=512"
npm install next@13.4.19 --save --no-optional
npm install --production --no-optional --arch=x64 --platform=linux

# Build with reduced memory usage
npm run build

# Setup PM2
pm2 delete all || true
pm2 start npm --name "kappy" -- start
pm2 save
pm2 startup
EOF

#---------------------------------------------------------
# Monitoring Setup
#---------------------------------------------------------
# Create status check script
cat > /home/ec2-user/check-status.sh << 'EOF'
#!/bin/bash
echo "=== System Status ==="
free -h
df -h
echo -e "\n=== Node.js Status ==="
node -v
npm -v
echo -e "\n=== Application Status ==="
pm2 status
echo -e "\n=== Environment ==="
echo "Current IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo -e "\n=== Recent Logs ==="
pm2 logs kappy --lines 20
EOF

chmod +x /home/ec2-user/check-status.sh
chown ec2-user:ec2-user /home/ec2-user/check-status.sh

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

3. Monitor resources:
   ./check-status.sh

4. Common commands:
   - View status: pm2 status
   - Restart app: pm2 restart kappy
   - View logs: pm2 logs kappy
   - Check memory: free -h
==============================================
""" 