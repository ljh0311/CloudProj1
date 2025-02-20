#!/bin/bash

#=========================================================
# EC2 User Data Script for KAPPY E-commerce
#=========================================================

set -e # Exit on error

# Enable logging
exec > >(tee /var/log/kappy-setup.log) 2>&1
echo "Starting EC2 initialization at $(date)"

# Update system and install git
sudo yum update -y
sudo yum install -y git --allowerasing

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Clone repository
git clone https://github.com/ljh0311/CloudProj1.git
cd CloudProj1

# Set permissions
chown -R ec2-user:ec2-user /home/ec2-user/app

# Run the startup script
chmod +x scripts/AWS-start-up-code.sh
sudo -u ec2-user ./scripts/AWS-start-up-code.sh 