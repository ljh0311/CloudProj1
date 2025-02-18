#!/bin/bash

echo "🔍 Starting AWS deployment check..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed"
    exit 1
fi

# Run the deployment check script
echo "📋 Running deployment diagnostics..."
node scripts/check-deployment.js

# Check PM2 status
echo -e "\n📊 PM2 Process Status:"
pm2 list

# Check application logs
echo -e "\n📜 Recent Application Logs:"
pm2 logs --lines 20 --nostream

# Check if MySQL is running
echo -e "\n🗄️ Checking MySQL status..."
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL is running"
else
    echo "❌ MySQL is not running"
fi

# Check disk space
echo -e "\n💾 Disk Space Usage:"
df -h /

# Check memory usage
echo -e "\n🧮 Memory Usage:"
free -h

# Check current IP
echo -e "\n🌐 Network Information:"
echo "Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Private IP: $(hostname -I | awk '{print $1}')"

# Check security group rules
echo -e "\n🔒 Security Group Rules:"
curl -s http://169.254.169.254/latest/meta-data/security-groups

echo -e "\n✨ Check complete!" 