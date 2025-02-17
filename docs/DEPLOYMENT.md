# Web-Based AWS Deployment Guide for KAPPY

## Prerequisites
- AWS Account with access to the AWS Management Console
- Node.js v14 or higher installed locally
- MySQL Workbench installed locally
- Git installed locally

## Step 1: AWS RDS Setup

### Create RDS Instance
1. Log in to [AWS Management Console](https://console.aws.amazon.com)
2. Navigate to RDS Dashboard
3. Click "Create database"
4. Configure settings:
   - Choose "Standard create"
   - Select MySQL engine
   - Choose "Free tier" template
   - Set DB instance identifier to `kappy-db`
   - Set master username to `admin`
   - Create and save a secure master password
   - Choose db.t3.micro instance
   - Allocate 20GB storage
   - Enable autoscaling
   - Select default VPC
   - Enable public access (for development)
   - Create new security group
   - Set initial database name to `kappy_db`
   - Enable automated backups
5. Click "Create database"
6. Save the endpoint URL shown in the connectivity section

## Step 2: EC2 Instance Setup

### Launch EC2 Instance
1. Navigate to EC2 Dashboard
2. Click "Launch instance"
3. Configure instance:
   - Name: kappy-ec2
   - AMI: Amazon Linux 2023
   - Instance type: t2.micro (free tier)
   - Create new key pair (download and save .pem file)
   - Create security group with:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere
     - Custom TCP (port 3000) from anywhere
4. Click "Launch instance"
5. Note the public IPv4 address

### Connect to EC2 Instance
1. Open terminal on your local machine
2. Change key pair permissions:
   ```bash
   chmod 400 path/to/your-key.pem
   ```
3. Connect via SSH:
   ```bash
   ssh -i path/to/your-key.pem ec2-user@your-ec2-public-ip
   ```

### Setup EC2 Environment
1. Update system packages:
   ```bash
   sudo yum update -y
   ```

2. Install Node.js:
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   ```

3. Install Git:
   ```bash
   sudo yum install -y git
   ```

4. Install MySQL client:
   ```bash
   sudo yum install -y mysql
   ```

## Step 3: Application Deployment

### Clone and Setup Repository
1. Clone the repository:
   ```bash
   cd ~
   git clone https://github.com/ljh0311/CloudProj1.git
   cd CloudProj1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install PM2 globally:
   ```bash
   sudo npm install -g pm2
   ```

### Verify Static Assets
1. Ensure required images are present:
   ```bash
   ls -l public/images
   ```
   You should see:
   - `logo3.jpg`: Application logo
   - `demoProduct.jpg`: Default product image

2. If images are missing, create the directory and copy them:
   ```bash
   mkdir -p public/images
   # Copy images from your local machine using SCP:
   scp -i path/to/your-key.pem path/to/local/images/* ec2-user@your-ec2-public-ip:~/CloudProj1/public/images/
   ```

3. Set proper permissions:
   ```bash
   chmod 644 public/images/*
   ```

### Configure Environment
1. Create .env file:
   ```bash
   cp .env.example .env
   ```

2. Edit .env with your configuration:
   ```env
   # Database Configuration
   DB_HOST=your-rds-endpoint
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   DB_NAME=kappy_db

   # Application Configuration
   NODE_ENV=production
   PORT=3000

   # Authentication Configuration
   NEXTAUTH_URL=http://your-ec2-public-ip:3000
   NEXTAUTH_SECRET=generate-a-secure-secret

   # API Configuration
   NEXT_PUBLIC_API_URL=http://your-ec2-public-ip:3000/api
   ```

### Database Migration
1. Connect to RDS from EC2:
   ```bash
   mysql -h your-rds-endpoint -u admin -p
   ```

2. Run migration script:
   ```bash
   node scripts/migrate-db.js
   ```

### Start Application
1. Build the application:
   ```bash
   npm run build
   ```

2. Start with PM2:
   ```bash
   pm2 start npm --name "kappy" -- start
   ```

3. Configure PM2 startup:
   ```bash
   pm2 save
   pm2 startup
   ```

## Step 4: Security Configuration

### Update RDS Security Group
1. Go to EC2 Dashboard > Security Groups
2. Find your RDS security group
3. Add inbound rule:
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: Your EC2 security group ID

### Configure Backup
1. Enable automated RDS backups:
   - Go to RDS Dashboard
   - Select your database
   - Modify
   - Set backup retention period to 7 days

2. Setup JSON backups on EC2:
   ```bash
   mkdir -p ~/CloudProj1/data/backups
   ```

## Step 5: Monitoring Setup

### CloudWatch Basic Monitoring
1. Go to CloudWatch Dashboard
2. Create alarms for:
   - EC2 CPU Utilization
   - RDS CPU Utilization
   - RDS Free Storage Space

### Application Monitoring
1. Install PM2 monitoring:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. View monitoring:
   ```bash
   pm2 monit
   ```

## Troubleshooting Guide

### Common Issues
1. Cannot connect to RDS:
   - Verify security group settings
   - Check endpoint URL in .env
   - Test connection: `mysql -h endpoint -u admin -p`

2. Application not starting:
   - Check PM2 logs: `pm2 logs kappy`
   - Verify environment variables
   - Check build output: `npm run build`

3. Database migration fails:
   - Verify RDS credentials
   - Check database exists: `mysql -h endpoint -u admin -p -e "SHOW DATABASES;"`
   - Ensure proper permissions

### Useful Commands
```bash
# View application logs
pm2 logs kappy

# Monitor application
pm2 monit

# Test database connection
mysql -h your-rds-endpoint -u admin -p -e "SELECT 1"

# Restart application
pm2 restart kappy

# View EC2 system logs
sudo tail -f /var/log/cloud-init-output.log
``` 