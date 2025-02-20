#!/bin/bash

#=========================================================
# AWS Startup Script for KAPPY E-commerce
# This script handles the complete setup of the application
#=========================================================

set -e # Exit on error

# Enable logging
exec > >(tee /var/log/kappy-setup.log) 2>&1
echo "Starting setup at $(date)"

#---------------------------------------------------------
# Configuration
#---------------------------------------------------------
APP_DIR="/home/ec2-user/app/CloudProj1"
NODE_ENV="production"
DB_HOST="https://cloudprojdb.ck5ndmxmjmjr.us-east-1.rds.amazonaws.com"
DB_USER="admin"
DB_PASSWORD="Kappy2dmiN"
DB_NAME="kappy_db"

# Get instance metadata
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region || echo "us-east-1")
PUBLIC_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "54.159.253.0")
PRIVATE_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/local-ipv4)

echo "🚀 Starting server configuration..."

#---------------------------------------------------------
# System Setup
#---------------------------------------------------------
# Configure swap space for t2.micro
echo "⚙️ Configuring swap space..."
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=128M count=16
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Update system and install dependencies
echo "📦 Updating system packages..."
sudo yum update -y
sudo yum install -y git mysql jq amazon-cloudwatch-agent --allowerasing

#---------------------------------------------------------
# Application Setup
#---------------------------------------------------------
echo "📂 Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository if not exists
if [ ! -d ".git" ]; then
    git clone https://github.com/ljh0311/CloudProj1.git .
fi

#---------------------------------------------------------
# Node.js Setup
#---------------------------------------------------------
echo "🟢 Setting up Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18.18.0
nvm use 18.18.0
nvm alias default 18.18.0

# Install PM2 globally
npm install -g pm2

#---------------------------------------------------------
# Environment Configuration
#---------------------------------------------------------
echo "🔧 Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Application Configuration
NODE_ENV=$NODE_ENV
PORT=3000

# Load Balancer Configuration
BEHIND_PROXY=true
TRUST_PROXY=true

# Authentication Configuration
NEXTAUTH_URL=http://${PUBLIC_IP}:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# API Configuration
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:3000/api

# Security Configuration
SECURE_COOKIES=true
SESSION_SECRET=$(openssl rand -base64 32)

# Instance Metadata
INSTANCE_ID=${INSTANCE_ID}
REGION=${REGION}
EOF

chmod 600 .env

#---------------------------------------------------------
# Database Check
#---------------------------------------------------------
echo "🔌 Checking connection to RDS..."
max_attempts=30
attempt=1
while ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Failed to connect to RDS after $max_attempts attempts"
        exit 1
    fi
    echo "Attempt $attempt: Waiting for RDS connection..."
    sleep 2
    ((attempt++))
done

echo "✅ Successfully connected to RDS!"

#---------------------------------------------------------
# Application Installation and Build
#---------------------------------------------------------
echo "🏗️ Installing dependencies and building..."
npm install --production
npm run build

#---------------------------------------------------------
# PM2 Configuration
#---------------------------------------------------------
echo "🔄 Configuring PM2..."
pm2 delete all || true
pm2 start npm --name "kappy" -i max --time -- start
pm2 save
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v18.18.0/bin pm2 startup

#---------------------------------------------------------
# Health Check Setup
#---------------------------------------------------------
echo "🏥 Setting up health check..."
cat > health-check.sh << 'EOF'
#!/bin/bash
curl -f http://localhost:3000/api/health || exit 1
EOF

chmod +x health-check.sh

#---------------------------------------------------------
# CloudWatch Configuration
#---------------------------------------------------------
echo "📊 Configuring CloudWatch agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "root"
    },
    "metrics": {
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60,
                "totalcpu": true
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": ["swap_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/kappy-setup.log",
                        "log_group_name": "/kappy/setup",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    }
}
EOF

systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

#---------------------------------------------------------
# Final Status Check
#---------------------------------------------------------
echo "🔍 Performing final checks..."
echo "Memory Usage:"
free -h
echo "Disk Space:"
df -h
echo "Node.js Version:"
node -v
echo "PM2 Status:"
pm2 status
echo "Application Health:"
./health-check.sh && echo "✅ Application is healthy" || echo "❌ Application health check failed"

echo """
==============================================
✨ SETUP COMPLETE! SERVER IS READY
==============================================
Instance ID: ${INSTANCE_ID}
Public IP: ${PUBLIC_IP}
Private IP: ${PRIVATE_IP}
Region: ${REGION}

URLs:
- Application: http://${PUBLIC_IP}:3000
- API: http://${PUBLIC_IP}:3000/api
- Health Check: http://${PUBLIC_IP}:3000/api/health

Monitor with:
1. CloudWatch Metrics
2. PM2 logs: pm2 logs kappy
3. Setup log: /var/log/kappy-setup.log
==============================================
""" 