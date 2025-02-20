#!/bin/bash

#=========================================================
# Environment Update Script for KAPPY E-commerce
#=========================================================

set -e # Exit on error

# Function to generate a secure random string
generate_secret() {
    openssl rand -base64 32
}

# Function to update environment file
update_env_file() {
    local file=$1
    local ip=$2
    local auth_secret=$3
    local temp_file="${file}.tmp"

    # Create backup
    cp "$file" "${file}.backup"

    # Update the file
    sed -i.bak \
        -e "s|NEXTAUTH_URL=http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:3000|NEXTAUTH_URL=http://${ip}:3000|g" \
        -e "s|NEXT_PUBLIC_API_URL=http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:3000/api|NEXT_PUBLIC_API_URL=http://${ip}:3000/api|g" \
        -e "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${auth_secret}|g" \
        "$file"

    echo "✅ Updated $file"
}

# Main script
echo "🔄 Starting environment update process..."

# Get the current public IP from instance metadata
echo "📡 Fetching instance metadata..."
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
PUBLIC_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/public-ipv4)

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ Failed to get public IP from metadata"
    exit 1
fi

echo "📍 Public IP: $PUBLIC_IP"

# Generate new NextAuth secret
echo "🔑 Generating new NextAuth secret..."
NEW_AUTH_SECRET=$(generate_secret)

# Update both environment files
echo "📝 Updating environment files..."

# Update .env
if [ -f ".env" ]; then
    update_env_file ".env" "$PUBLIC_IP" "$NEW_AUTH_SECRET"
else
    echo "⚠️ .env file not found"
fi

# Update .env.production
if [ -f ".env.production" ]; then
    update_env_file ".env.production" "$PUBLIC_IP" "$NEW_AUTH_SECRET"
else
    echo "⚠️ .env.production file not found"
fi

echo """
✅ Environment update completed!

Updated Settings:
----------------
Public IP: $PUBLIC_IP
NextAuth URL: http://${PUBLIC_IP}:3000
API URL: http://${PUBLIC_IP}:3000/api
NextAuth Secret: [Updated with new secure value]

Next Steps:
-----------
1. Restart the application:
   ./scripts/deploy.sh

2. Verify the changes:
   curl http://${PUBLIC_IP}:3000/api/health

Note: A backup of each modified file has been created with .backup extension
""" 