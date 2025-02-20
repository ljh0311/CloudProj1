#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔒 Configuring security settings...${NC}"

# Get instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
VPC_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].VpcId' --output text --region $REGION)

echo -e "\n${YELLOW}📊 Instance Information:${NC}"
echo "Instance ID: $INSTANCE_ID"
echo "Region: $REGION"
echo "VPC ID: $VPC_ID"

# Create security group for the EC2 instance
echo -e "\n${YELLOW}🛡️ Creating security group for EC2...${NC}"
SECURITY_GROUP_NAME="kappy-web-sg"
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Security group for KAPPY web application" \
    --vpc-id $VPC_ID \
    --region $REGION \
    --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Security group created: $SECURITY_GROUP_ID${NC}"
else
    echo -e "${RED}❌ Failed to create security group${NC}"
    exit 1
fi

# Add inbound rules
echo -e "\n${YELLOW}🔓 Configuring inbound rules...${NC}"

# Allow HTTP (80)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow HTTPS (443)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow custom application port (3000)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow MySQL (3306) from the EC2 security group to RDS
echo -e "\n${YELLOW}🔒 Configuring RDS security group...${NC}"

# Get RDS security group
RDS_SECURITY_GROUP_ID=$(aws rds describe-db-instances \
    --db-instance-identifier database1 \
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text \
    --region $REGION)

if [ ! -z "$RDS_SECURITY_GROUP_ID" ]; then
    aws ec2 authorize-security-group-ingress \
        --group-id $RDS_SECURITY_GROUP_ID \
        --protocol tcp \
        --port 3306 \
        --source-group $SECURITY_GROUP_ID \
        --region $REGION

    echo -e "${GREEN}✅ Added MySQL access from EC2 to RDS${NC}"
else
    echo -e "${RED}❌ Could not find RDS security group${NC}"
fi

# Attach security group to the instance
echo -e "\n${YELLOW}🔗 Attaching security group to instance...${NC}"
aws ec2 modify-instance-attribute \
    --instance-id $INSTANCE_ID \
    --groups $SECURITY_GROUP_ID \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Security group attached successfully${NC}"
else
    echo -e "${RED}❌ Failed to attach security group${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Security configuration completed!${NC}"
echo -e "\n${YELLOW}🔍 Verifying ports...${NC}"

# Function to check if a port is open
check_port() {
    nc -zv localhost $1 2>&1
}

# Check critical ports
echo "Checking port 80 (HTTP)..."
check_port 80
echo "Checking port 443 (HTTPS)..."
check_port 443
echo "Checking port 3000 (Application)..."
check_port 3000
echo "Checking port 3306 (MySQL)..."
check_port 3306

echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo "1. Configure SSL certificate for HTTPS"
echo "2. Set up nginx as reverse proxy"
echo "3. Update DNS records"
echo "4. Test all endpoints" 