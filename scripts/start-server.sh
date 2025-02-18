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

# Install MySQL if not installed
echo "🗄️ Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "Installing MySQL..."
    sudo yum update -y
    sudo yum install -y mariadb-server
    sudo systemctl start mariadb
    sudo systemctl enable mariadb

    # Secure MySQL installation
    echo "Securing MySQL installation..."
    sudo mysql -e "UPDATE mysql.user SET Password=PASSWORD('KappyAdmin') WHERE User='root';"
    sudo mysql -e "DELETE FROM mysql.user WHERE User='';"
    sudo mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    sudo mysql -e "DROP DATABASE IF EXISTS test;"
    sudo mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    sudo mysql -e "FLUSH PRIVILEGES;"

    # Create database and user
    echo "Creating database and user..."
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS kappy_db;"
    sudo mysql -e "GRANT ALL PRIVILEGES ON kappy_db.* TO 'root'@'localhost' IDENTIFIED BY 'KappyAdmin';"
    sudo mysql -e "FLUSH PRIVILEGES;"
fi

# Start MySQL if not running
if ! systemctl is-active --quiet mariadb; then
    echo "Starting MySQL..."
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
fi

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
max_attempts=30
attempt=1
while ! mysql -u root -pKappyAdmin -e "SELECT 1" >/dev/null 2>&1; do
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Failed to connect to MySQL after $max_attempts attempts"
        exit 1
    fi
    echo "Attempt $attempt: Waiting for MySQL to be ready..."
    sleep 2
    ((attempt++))
done

echo "✅ MySQL is ready!"

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
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
fi

# Run deployment check
echo "🔍 Running deployment check..."
node scripts/check-deployment.js

echo "✅ MySQL Status:"
sudo systemctl status mariadb

echo "✨ Setup complete! Server should be accessible at http://$IP:3000"
echo "📝 Check the deployment status above for any issues" 