#!/bin/bash

# Configuration
IP="54.159.253.0"
APP_DIR="/home/ec2-user/app/CloudProj1"
NODE_ENV="production"
DB_HOST="database1.czsa24cac7y5.us-east-1.rds.amazonaws.com"
DB_USER="admin"
DB_PASSWORD="KappyAdmin"
DB_NAME="kappy_db"

echo "🚀 Starting server configuration..."

# Navigate to application directory
cd $APP_DIR

# Update environment variables
echo "📝 Updating environment variables..."
sed -i "s/NEXTAUTH_URL=.*/NEXTAUTH_URL=http:\/\/$IP:3000/" .env.production
sed -i "s/NEXT_PUBLIC_API_URL=.*/NEXT_PUBLIC_API_URL=http:\/\/$IP:3000\/api/" .env.production

# Install MySQL client if not installed (for checking connection)
echo "🔧 Checking MySQL client..."
if ! command -v mysql &> /dev/null; then
    echo "Installing MySQL client..."
    sudo yum update -y
    sudo yum install -y mysql
fi

# Check RDS connection
echo "🔌 Checking connection to RDS..."
max_attempts=30
attempt=1
while ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Failed to connect to RDS after $max_attempts attempts"
        echo "Please check:"
        echo "1. RDS instance is running"
        echo "2. Security group allows inbound traffic on port 3306"
        echo "3. Database credentials are correct"
        exit 1
    fi
    echo "Attempt $attempt: Waiting for RDS connection..."
    sleep 2
    ((attempt++))
done

echo "✅ Successfully connected to RDS!"

# Verify database exists
echo "🔍 Verifying database..."
if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME" >/dev/null 2>&1; then
    echo "Creating database..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME"
fi

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

# Run database migrations if needed
echo "🔄 Running database migrations..."
node scripts/migrate-db.js

echo "✨ Setup complete! Server should be accessible at http://$IP:3000"
echo "📝 Check the deployment status above for any issues"

# Display connection info
echo -e "\n📊 Connection Information:"
echo "API URL: http://$IP:3000/api"
echo "Database Host: $DB_HOST"
echo "Database Name: $DB_NAME" 