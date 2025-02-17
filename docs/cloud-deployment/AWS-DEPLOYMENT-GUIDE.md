# Comprehensive AWS Deployment Guide for KAPPY E-commerce

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Storage Configuration](#storage-configuration)
5. [Application Deployment](#application-deployment)
6. [Security Configuration](#security-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [Maintenance Procedures](#maintenance-procedures)

## Prerequisites

### Required Accounts and Tools

* AWS Account with administrative access
* Domain name (for production deployment)
* Git installed locally
* Node.js v14 or higher
* MySQL Workbench
* AWS CLI configured locally

### Required AWS Services

* EC2 (Application hosting)
* RDS (Database)
* S3 (Static file storage)
* CloudFront (CDN)
* Route 53 (DNS management)
* Certificate Manager (SSL/TLS)
* CloudWatch (Monitoring)

## Infrastructure Setup

### 1. VPC Configuration

1. Create VPC:
   

```bash
   aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=kappy-vpc}]'
   ```

2. Create subnets:
   - Public subnet for EC2: 10.0.1.0/24
   - Private subnet for RDS: 10.0.2.0/24
   - Private subnet for RDS standby: 10.0.3.0/24

3. Configure Internet Gateway and NAT Gateway

### 2. EC2 Instance Setup

1. Launch EC2 instance:
   - AMI: Amazon Linux 2023
   - Instance Type: t2.micro (development) / t2.small (production)
   - VPC: kappy-vpc
   - Public subnet
   - Security group:

     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere
     - Custom TCP (3000) from anywhere

2. Configure security group:
   

```bash
   aws ec2 create-security-group \
     --group-name kappy-ec2-sg \
     --description "Security group for KAPPY EC2 instances"
   
   aws ec2 authorize-security-group-ingress \
     --group-name kappy-ec2-sg \
     --protocol tcp \
     --port 22 \
     --cidr YOUR_IP/32
   ```

### 3. Load Balancer Setup

1. Create Application Load Balancer:
   - Scheme: internet-facing
   - IP address type: ipv4
   - Listeners: HTTP (80), HTTPS (443)
   - VPC: kappy-vpc
   - Subnets: all public subnets

2. Configure target group:
   - Target type: instances
   - Protocol: HTTP
   - Port: 3000
   - Health check path: /api/health

## Database Setup

### 1. RDS Instance

1. Create parameter group:
   

```bash
   aws rds create-db-parameter-group \
     --db-parameter-group-name kappy-mysql-params \
     --db-parameter-group-family mysql8.0 \
     --description "Custom parameters for KAPPY MySQL"
   ```

2. Launch RDS instance:
   

```bash
   aws rds create-db-instance \
     --db-instance-identifier kappy-db \
     --db-instance-class db.t3.micro \
     --engine mysql \
     --master-username admin \
     --master-user-password YOUR_PASSWORD \
     --allocated-storage 20 \
     --db-name kappy_db \
     --vpc-security-group-ids sg-xxxxxxxx \
     --db-subnet-group-name kappy-db-subnet-group \
     --backup-retention-period 7 \
     --multi-az
   ```

### 2. Database Migration

1. Create schema:
   

```sql
   CREATE TABLE users (
       id VARCHAR(36) PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       name VARCHAR(255),
       password VARCHAR(255),
       role ENUM('user', 'admin') DEFAULT 'user',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   CREATE TABLE products (
       id VARCHAR(36) PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       description TEXT,
       price DECIMAL(10, 2) NOT NULL,
       category VARCHAR(100),
       image_url VARCHAR(255),
       size_s_stock INT DEFAULT 20,
       size_m_stock INT DEFAULT 20,
       size_l_stock INT DEFAULT 20,
       material VARCHAR(100),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   CREATE TABLE orders (
       id VARCHAR(36) PRIMARY KEY,
       user_id VARCHAR(36),
       status VARCHAR(50) DEFAULT 'pending',
       total_amount DECIMAL(10, 2) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

2. Run migration script:
   

```bash
   node scripts/migrate-db.js
   ```

## Storage Configuration

### 1. S3 Bucket Setup

1. Create bucket:
   

```bash
   aws s3api create-bucket \
     --bucket kappy-assets \
     --region ap-southeast-1 \
     --create-bucket-configuration LocationConstraint=ap-southeast-1
   ```

2. Configure CORS:
   

```json
   {
       "CORSRules": [
           {
               "AllowedHeaders": ["*"],
               "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
               "AllowedOrigins": ["*"],
               "ExposeHeaders": []
           }
       ]
   }
   ```

3. Create bucket policy:
   

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

### 2. CloudFront Distribution

1. Create distribution:
   - Origin domain: kappy-assets.s3.ap-southeast-1.amazonaws.com
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Cache policy: Managed-CachingOptimized
   - Price class: Use all edge locations
   - WAF: Enable
   - SSL certificate: Request new certificate

## Application Deployment

### 1. Environment Setup

1. Install dependencies:
   

```bash
   sudo yum update -y
   sudo yum install -y git nodejs npm mysql
   sudo npm install -g pm2
   ```

2. Configure environment variables:
   

```bash
   cat > .env << EOF
   # Database
   DB_HOST=your-rds-endpoint
   DB_USER=admin
   DB_PASSWORD=your-password
   DB_NAME=kappy_db

   # AWS
   AWS_REGION=ap-southeast-1
   S3_BUCKET=kappy-assets
   CLOUDFRONT_URL=your-cloudfront-url

   # Application
   NODE_ENV=production
   PORT=3000
   NEXTAUTH_URL=https://your-domain
   NEXTAUTH_SECRET=your-secret
   EOF
   ```

### 2. Application Setup

1. Clone and build:
   

```bash
   git clone https://github.com/your-repo/kappy.git
   cd kappy
   npm install
   npm run build
   ```

2. Configure PM2:
   

```bash
   pm2 start npm --name "kappy" -- start
   pm2 startup
   pm2 save
   ```

### 3. Nginx Setup

1. Install and configure:
   

```bash
   sudo yum install -y nginx
   
   sudo cat > /etc/nginx/conf.d/kappy.conf << EOF
   server {
       listen 80;
       server_name your-domain;

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
   ```

2. Enable and start Nginx:
   

```bash
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

## Security Configuration

### 1. SSL/TLS Setup

1. Request certificate:
   

```bash
   aws acm request-certificate \
     --domain-name your-domain \
     --validation-method DNS \
     --region us-east-1
   ```

2. Configure Route 53 for validation

### 2. Security Groups

1. Update EC2 security group:
   

```bash
   aws ec2 update-security-group-rule-descriptions-ingress \
     --group-id sg-xxxxxxxx \
     --ip-permissions '[{"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "Allow HTTP"}]}]'
   ```

### 3. IAM Roles

1. Create EC2 role:
   

```bash
   aws iam create-role \
     --role-name KappyEC2Role \
     --assume-role-policy-document file://ec2-trust-policy.json
   ```

2. Attach policies:
   

```bash
   aws iam attach-role-policy \
     --role-name KappyEC2Role \
     --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
   ```

## Monitoring Setup

### 1. CloudWatch

1. Create dashboard:
   

```bash
   aws cloudwatch create-dashboard \
     --dashboard-name KappyDashboard \
     --dashboard-body file://dashboard.json
   ```

2. Configure alarms:
   

```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name CPUUtilization \
     --alarm-description "CPU utilization exceeds 80%" \
     --metric-name CPUUtilization \
     --namespace AWS/EC2 \
     --statistic Average \
     --period 300 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2
   ```

### 2. Logging

1. Configure CloudWatch agent:
   

```bash
   sudo yum install -y amazon-cloudwatch-agent
   ```

2. Configure log collection:
   

```json
   {
       "logs": {
           "logs_collected": {
               "files": {
                   "collect_list": [
                       {
                           "file_path": "/var/log/nginx/access.log",
                           "log_group_name": "/kappy/nginx/access",
                           "log_stream_name": "{instance_id}"
                       }
                   ]
               }
           }
       }
   }
   ```

## Maintenance Procedures

### 1. Backup Procedures

1. Database backups:
   - Automated daily snapshots (RDS)
   - Manual snapshots before major changes

2. Application backups:
   - S3 versioning enabled
   - Regular JSON data backups

### 2. Update Procedures

1. Application updates:
   

```bash
   cd ~/kappy
   git pull
   npm install
   npm run build
   pm2 restart kappy
   ```

2. System updates:
   

```bash
   sudo yum update -y
   sudo systemctl restart nginx
   ```

### 3. Monitoring Checks

1. Daily checks:
   - CloudWatch metrics
   - Error logs
   - Database performance
   - Application health endpoint

2. Weekly checks:
   - Security group rules
   - SSL certificate status
   - Backup integrity
   - Cost analysis

### 4. Scaling Procedures

1. Vertical scaling:
   - Modify EC2 instance type
   - Modify RDS instance class

2. Horizontal scaling:
   - Add EC2 instances to load balancer
   - Configure Auto Scaling Group 
