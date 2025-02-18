#!/bin/bash

# Configuration
IP="54.159.253.0"
APP_DIR="/home/ec2-user/app/CloudProj1"
NODE_ENV="production"

echo "🚀 Starting server configuration..."

# Navigate to application directory
cd $APP_DIR

# Update environment variables
echo "📝 Updating environment variables..."
sed -i "s/NEXTAUTH_URL=.*/NEXTAUTH_URL=http:\/\/$IP:3000/" .env.production
sed -i "s/NEXT_PUBLIC_API_URL=.*/NEXT_PUBLIC_API_URL=http:\/\/$IP:3000\/api/" .env.production

# Start MySQL if not running
echo "🗄️ Checking MySQL..."
if ! systemctl is-active --quiet mysqld; then
    echo "Starting MySQL..."
    sudo systemctl start mysqld
    sudo systemctl enable mysqld
fi

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
while ! mysqladmin ping -h localhost --silent; do
    sleep 1
done

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "🏗️ Building application..."
npm run build

# Start/Restart PM2 process
echo "🔄 Starting application with PM2..."
if pm2 list | grep -q "kappy"; then
    pm2 restart kappy
else
    pm2 start npm --name "kappy" -- start
fi

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot if not already configured
if ! systemctl is-enabled --quiet pm2-ec2-user; then
    echo "⚙️ Configuring PM2 startup..."
    pm2 startup
fi

# Run deployment check
echo "🔍 Running deployment check..."
node scripts/check-deployment.js

echo "✨ Setup complete! Server should be accessible at http://$IP:3000"
echo "📝 Check the deployment status above for any issues" 