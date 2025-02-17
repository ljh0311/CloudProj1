# EC2 Key Pair Management Guide for Free Tier

## Creating and Managing EC2 Key Pair

### Step 1: Create Key Pair in AWS Console
1. Log in to AWS Management Console
2. Navigate to EC2 Dashboard
3. In the left sidebar, under "Network & Security", click "Key Pairs"
4. Click "Create key pair"
5. Configure the key pair:
   - Name: `kappy-key-pair`
   - Key pair type: RSA
   - Private key file format: .pem
   - Tags: Optional (can skip in free tier)
6. Click "Create key pair"
7. The .pem file will automatically download to your computer
   - Default name will be `kappy-key-pair.pem`
   - **IMPORTANT**: This is your only chance to download the private key file

### Step 2: Secure Your Key Pair (Windows)
1. Create a secure directory for your key:
   ```powershell
   # Create .ssh directory if it doesn't exist
   mkdir -p "$env:USERPROFILE\.ssh"
   ```

2. Move the key pair file:
   - Move `kappy-key-pair.pem` from your Downloads folder to `C:\Users\YourUsername\.ssh\`
   - You can do this via File Explorer or PowerShell:
     ```powershell
     Move-Item "$env:USERPROFILE\Downloads\kappy-key-pair.pem" "$env:USERPROFILE\.ssh\kappy-key-pair.pem"
     ```

3. Set correct permissions:
   ```powershell
   # Remove inheritance and all existing permissions
   icacls "$env:USERPROFILE\.ssh\kappy-key-pair.pem" /inheritance:r
   # Add read permission only for current user
   icacls "$env:USERPROFILE\.ssh\kappy-key-pair.pem" /grant:r "$($env:USERNAME):(R)"
   ```

### Step 3: Launch EC2 Instance with Key Pair
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Basic configuration:
   - Name: kappy-ec2
   - AMI: Amazon Linux 2023 (Free tier eligible)
   - Instance type: t2.micro (Free tier eligible)
   
4. Key pair selection:
   - Under "Key pair (login)", select "Select existing key pair"
   - Choose `kappy-key-pair` from the dropdown
   - Check the acknowledgment box
   
5. Network settings (Free tier compatible):
   - VPC: Default
   - Auto-assign Public IP: Enable
   - Security group: Create new
   - Allow SSH from your IP
   - Allow HTTP and HTTPS

6. Storage:
   - 8 GB gp2 (Free tier eligible)

7. Advanced Details:
   - Expand "Advanced details" section
   - Scroll to "User data"
   - Select "As text"
   - Copy and paste this initialization script:
     ```bash
     #!/bin/bash
     
     # Update system packages
     sudo yum update -y
     
     # Install required software
     sudo yum install -y git
     sudo yum install -y mysql
     
     # Install Node.js 16.x
     curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
     sudo yum install -y nodejs
     
     # Install PM2 globally
     sudo npm install -g pm2
     
     # Create application directory
     mkdir -p /home/ec2-user/app
     cd /home/ec2-user/app
     
     # Set correct permissions
     sudo chown -R ec2-user:ec2-user /home/ec2-user/app
     
     # Install nginx
     sudo yum install -y nginx
     
     # Start and enable nginx
     sudo systemctl start nginx
     sudo systemctl enable nginx
     
     # Create a basic nginx configuration for the application
     sudo tee /etc/nginx/conf.d/kappy.conf << EOF
     server {
         listen 80;
         server_name _;
     
         location / {
             proxy_pass http://localhost:3000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade \$http_upgrade;
             proxy_set_header Connection 'upgrade';
             proxy_set_header Host \$host;
             proxy_cache_bypass \$http_upgrade;
         }
     }
     EOF
     
     # Remove default nginx configuration
     sudo rm -f /etc/nginx/conf.d/default.conf
     
     # Restart nginx to apply changes
     sudo systemctl restart nginx
     
     # Set up application environment file
     tee /home/ec2-user/app/.env << EOF
     # Database Configuration
     DB_HOST=your-rds-endpoint
     DB_USER=admin
     DB_PASSWORD=your-password
     DB_NAME=kappy_db
     
     # Application Configuration
     NODE_ENV=production
     PORT=3000
     
     # Authentication Configuration
     NEXTAUTH_URL=http://your-ec2-public-ip:3000
     NEXTAUTH_SECRET=your-generated-secret
     
     # API Configuration
     NEXT_PUBLIC_API_URL=http://your-ec2-public-ip:3000/api
     EOF
     
     # Set correct permissions for .env file
     chmod 600 /home/ec2-user/app/.env
     
     # Create a welcome page
     sudo tee /home/ec2-user/app/index.html << EOF
     <!DOCTYPE html>
     <html>
     <head>
         <title>KAPPY - Setup Complete</title>
         <style>
             body { font-family: Arial, sans-serif; margin: 40px; }
             .success { color: #28a745; }
         </style>
     </head>
     <body>
         <h1>🎉 EC2 Setup Complete!</h1>
         <p class="success">Your EC2 instance has been successfully initialized.</p>
         <h2>Next Steps:</h2>
         <ol>
             <li>Clone your repository</li>
             <li>Update the .env file with your configurations</li>
             <li>Run database migrations</li>
             <li>Start your application with PM2</li>
         </ol>
     </body>
     </html>
     EOF
   
8. Click "Launch instance"

### Step 4: Connect to Your Instance
1. Wait for instance to be running and status checks to pass

2. Get your instance's public IP:
   - Select your instance in EC2 Dashboard
   - Copy the "Public IPv4 address"

3. Connect using PowerShell:
   ```powershell
   ssh -i "$env:USERPROFILE\.ssh\kappy-key-pair.pem" ec2-user@your-instance-public-ip
   ```

4. If you see a warning about unprotected key file, fix permissions as shown in Step 2

### Important Safety Rules
1. Never:
   - Share your .pem file
   - Commit the .pem file to version control
   - Upload the .pem file to public locations
   - Store the .pem file in your project directory

2. Always:
   - Keep a secure backup of the .pem file
   - Protect the .pem file with correct permissions
   - Use a different key pair for production and development

3. Remember:
   - If you lose the key pair, you cannot recover it
   - You'll need to terminate the instance and create a new one with a new key pair
   - Free tier allows you to create multiple key pairs at no cost

### Troubleshooting Common Issues
1. "Permission denied" error:
   ```powershell
   # Fix permissions
   icacls "$env:USERPROFILE\.ssh\kappy-key-pair.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
   ```

2. "Connection timed out":
   - Verify security group allows SSH from your IP
   - Check that instance is running
   - Verify you're using correct public IP

3. "Key file not found":
   - Verify path to .pem file
   - Check if file was moved or renamed
   - Ensure you're using correct key pair name 