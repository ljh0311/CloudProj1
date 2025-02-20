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

## 3. Elastic Load Balancer (ELB) Setup

### Step 1: Create Application Load Balancer

1. Go to AWS Console → EC2 → Load Balancers → Create Load Balancer
2. Choose "Application Load Balancer"
3. Configure basic settings:
   - Name: `kappy-alb`
   - Scheme: internet-facing
   - IP address type: ipv4
   - VPC: Default VPC
   - Mappings: Select at least two Availability Zones

4. Configure Security Settings:
   - Add HTTPS listener (recommended)
   - Upload or choose SSL certificate

5. Configure Security Groups:
   - Create new security group
   - Allow HTTP (80) and HTTPS (443) from anywhere

6. Configure Routing:
   - Create new target group
   - Name: `kappy-tg`
   - Protocol: HTTP
   - Port: 80
   - Target type: Instance
   - Health check path: `/api/health`
   - Advanced health check settings:
     - Healthy threshold: 2
     - Unhealthy threshold: 3
     - Timeout: 5 seconds
     - Interval: 30 seconds

7. Register Targets:
   - Add your EC2 instance to the target group
   - Review and create

## 4. Auto Scaling Setup

### Step 1: Create Launch Template

1. Go to EC2 → Launch Templates → Create launch template
2. Basic configuration:
   - Name: `kappy-launch-template`
   - Description: "Launch template for Kappy e-commerce auto scaling"
   - AMI: Amazon Linux 2
   - Instance type: t2.micro (free tier)
   - Key pair: Select your key pair

3. Network settings:
   - VPC: Default VPC
   - Security group: Use the same as your EC2 instance

4. Advanced details:
   - IAM instance profile: Select appropriate role
   - User data: Copy from `cloud-deployment/ec2-user-data.sh`

### Step 2: Create Auto Scaling Group

1. Go to EC2 → Auto Scaling Groups → Create Auto Scaling group
2. Choose launch template:
   - Name: `kappy-asg`
   - Launch template: `kappy-launch-template`

3. Configure settings:
   - VPC: Default VPC
   - Subnets: Select multiple AZs

4. Configure advanced options:
   - Load balancing: Attach to existing load balancer
   - Select target group: `kappy-tg`
   - Health check type: ELB
   - Health check grace period: 300 seconds

5. Configure group size:
   - Desired capacity: 2
   - Minimum capacity: 1
   - Maximum capacity: 4

6. Configure scaling policies:
   - Target tracking scaling policy
   - Metric type: Average CPU utilization
   - Target value: 70%

7. Add notifications (optional):
   - Create SNS topic
   - Configure notifications for scaling events

### Step 3: Verify Setup

1. Check that instances are launching correctly
2. Verify they are being added to the target group
3. Test load balancer DNS name
4. Monitor CloudWatch metrics for:
   - CPU Utilization
   - Request count per target
   - Healthy host count

## Important Notes

- Always use security groups to restrict access appropriately
- Monitor costs, especially with auto scaling enabled
- Regularly review and update scaling policies based on actual usage patterns
- Consider setting up CloudWatch alarms for monitoring
- Implement proper logging and monitoring through CloudWatch
