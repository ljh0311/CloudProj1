# AWS Setup Guide for KAPPY E-commerce

This guide provides step-by-step instructions for setting up AWS services using the web console.

## Quick Setup Steps

1. Set up RDS Database (Database1)
2. Launch EC2 Instance (2006cloud)
3. Use automated setup script

## 1. RDS Database Setup

### Step 1: Create RDS Instance
1. Go to AWS Console → RDS → Create database
2. Choose settings:
   - Standard create
   - MySQL (free tier eligible)
   - Templates: Free tier
   - DB instance identifier: `Database1`
   - Master username: `admin`
   - Master password: Create and save a secure password
   - Instance configuration: db.t3.micro
   - Storage: 20 GB (free tier eligible)
   - Enable storage autoscaling: No (for free tier)

3. Connectivity settings:
   - VPC: Default VPC
   - Public access: Yes (for development)
   - VPC security group: Create new
   - Availability Zone: No preference
   - Database port: 3306

4. Database authentication:
   - Password authentication

5. Additional configuration:
   - Initial database name: `kappy_db`
   - Backup retention: 7 days
   - Enable encryption: Yes

6. Click "Create database"

### Step 2: Configure Security Group
1. Go to EC2 → Security Groups
2. Find the RDS security group (it will have "rds" in the name)
3. Edit inbound rules:
   - Add rule:
     - Type: MySQL/Aurora
     - Port: 3306
     - Source: 0.0.0.0/0 (Allow all traffic)
     - Description: "Allow all traffic"

### Step 3: Save RDS Endpoint
1. Wait for RDS instance to be available (10-15 minutes)
2. Go to RDS → Databases → Database1
3. Copy the endpoint URL (needed for EC2 setup)

## 2. EC2 Instance Setup

### Step 1: Prepare Setup Script
1. Open `cloud-deployment/ec2-user-data.sh`
2. Replace these values:
   ```bash
   RDS_ENDPOINT="your-rds-endpoint"    # From RDS Step 3
   RDS_PASSWORD="KappyAdmin"           # Password you set in RDS
   EC2_PUBLIC_IP="your-ip"            # Leave empty, will get after launch
   
   # Generate a new secret using one of these methods:
   # Method 1 (Windows PowerShell):
   # [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   #
   # Method 2 (Linux/Mac Terminal):
   # openssl rand -base64 32
   #
   # Method 3 (Simple but less secure):
   # Use a random string generator website, make it at least 32 characters
   NEXTAUTH_SECRET="your-generated-secret"
   ```

3. Important notes about NEXTAUTH_SECRET:
   - Generate a new one for each deployment
   - Keep it private and secure
   - Don't reuse secrets between deployments
   - Make it at least 32 characters long

### Step 2: Launch EC2 Instance
1. Go to AWS Console → EC2 → Launch instance
2. Basic configuration:
   - Name: 2006cloud
   - AMI: Amazon Linux 2023 (free tier eligible)
   - Instance type: t2.micro (free tier eligible)
   - Key pair: 
     - Name: 2006Keypair
     - Type: RSA
     - Format: .pem

3. Network settings:
   - VPC: Default
   - Auto-assign public IP: Enable
   - Security group: Create new
     - Name: 2006cloud-sg
     - Description: Security group for 2006cloud
     - Add rules:
       - Allow all traffic (All protocols, port range: All, source: 0.0.0.0/0)

4. Configure storage:
   - 8 GB gp2 (free tier eligible)

5. Advanced details:
   - User data: Paste the modified ec2-user-data.sh script here

6. Click "Launch instance"

### Step 3: Complete Setup
1. Wait for instance to launch and get public IP
2. Update EC2_PUBLIC_IP in user data script with actual IP
3. Restart the instance to apply changes

## Verification

### 1. Check Setup Status
1. Wait 3-5 minutes for setup to complete
2. Visit http://your-ec2-public-ip:3000
3. You should see your application running

### 2. Troubleshooting
If the application doesn't load:
1. Connect to EC2 using EC2 Instance Connect
2. Check setup logs:
   ```bash
   cat /var/log/kappy-setup.log
   ```
3. Check application logs:
   ```bash
   pm2 logs kappy
   ```

## Common Management Commands
```bash
# View application status
pm2 status

# View logs
pm2 logs kappy

# Restart application
pm2 restart kappy

# Stop application
pm2 stop kappy

# Start application
pm2 start kappy
```

## 3. S3 Storage Setup

### Step 1: Create S3 Bucket
1. Go to AWS Console → S3 → Create bucket
2. Basic configuration:
   - Bucket name: kappy-assets
   - AWS Region: Same as your EC2/RDS
   - Object Ownership: ACLs disabled
   - Block Public Access settings: Uncheck "Block all public access"
   - Acknowledge public access warning

3. Bucket versioning:
   - Enable

4. Default encryption:
   - Enable server-side encryption
   - Encryption key type: Amazon S3-managed keys (SSE-S3)

5. Click "Create bucket"

### Step 2: Configure Bucket Policy
1. Go to bucket → Permissions
2. Edit Bucket policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::kappy-assets/*"
        }
    ]
}
```

### Step 3: Configure CORS
1. Go to bucket → Permissions → CORS
2. Add CORS configuration:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Verification Steps

### 1. RDS Connection
```bash
mysql -h database1.xxxxxxxxxxxx.ap-southeast-2.rds.amazonaws.com -u admin -p
```

### 2. S3 Access
Test uploading a file:
1. Go to S3 bucket
2. Click "Upload"
3. Add a test file
4. Make it public
5. Verify access via URL

### 3. EC2 Application
1. Check Node.js:
```bash
node -v
npm -v
```

2. Verify application is running:
```bash
pm2 status
pm2 logs kappy
```

3. Test the application:
   - Open your browser
   - Visit: http://3.26.102.46:3000
   - You should see your application running

4. Common PM2 commands:
```bash
# View application logs
pm2 logs kappy

# Restart application
pm2 restart kappy

# Stop application
pm2 stop kappy

# Start application
pm2 start kappy
```

## Troubleshooting Steps

### 1. Check Application Status
```bash
# Check if the application is running
pm2 status
pm2 logs kappy

# If needed, restart the application
pm2 restart kappy
```

### 2. Verify Port Access
```bash
# Check if the application is listening on port 3000
sudo netstat -tlpn | grep 3000

# Check if Node.js process is running
ps aux | grep node
```

### 3. Check Security Group Settings
1. Go to EC2 Dashboard → Security Groups
2. Find security group "2006cloud-sg"
3. Verify inbound rules:
   - Should have "All traffic" allowed from source 0.0.0.0/0
   - If not, edit rules to allow all traffic

### 4. Test Local Access on EC2
```bash
# Install curl if not present
sudo yum install -y curl

# Test local access
curl http://localhost:3000
```

### 5. Check Application Logs
```bash
# View real-time application logs
pm2 logs kappy

# View recent logs
pm2 logs kappy --lines 100
```

### 6. Database Connection Test
```bash
# Test database connection
mysql -h database1.xxxxxxxxxxxx.ap-southeast-2.rds.amazonaws.com -u admin -p
```

### 7. Common Issues and Solutions

1. If website doesn't load:
   - Check if application is running: `pm2 status`
   - Verify logs for errors: `pm2 logs kappy`
   - Ensure security group allows inbound traffic on port 3000

2. If database connection fails:
   - Verify RDS security group allows traffic from EC2
   - Check if database credentials in .env are correct
   - Ensure RDS instance is running

3. If application crashes:
   ```bash
   # Stop the application
   pm2 stop kappy
   
   # Clear PM2 logs
   pm2 flush
   
   # Start application with logs
   pm2 start npm --name "kappy" -- start
   pm2 logs kappy
   ```

4. If changes don't appear:
   ```bash
   # Rebuild and restart
   npm run build
   pm2 restart kappy
   ``` 