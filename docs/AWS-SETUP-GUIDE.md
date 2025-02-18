# AWS Setup Guide for KAPPY E-commerce

This guide provides step-by-step instructions for setting up AWS services using the web console.

## Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Access to AWS Systems Manager Parameter Store

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
