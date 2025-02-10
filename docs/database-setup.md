# Database Setup and Migration Guide

## Important Note: Current Data Storage
The application is currently using JSON files for data storage. MySQL/RDS integration is temporarily disabled to allow for easier initial setup and development. The JSON files are located in the `/data` directory:
- `/data/products.json`: Product data
- `/data/users.json`: User data

## Enabling MySQL/RDS Integration

### Prerequisites
Before enabling MySQL, ensure you have:
1. Created an AWS RDS instance
2. Configured security groups
3. Have your database credentials ready
4. Installed MySQL Workbench or similar tool

### Steps to Enable MySQL

1. In `utils/db.js`:
   - Uncomment the MySQL import
   - Uncomment the pool configuration
   - Uncomment the query function export

2. In `scripts/migrate-data.js`:
   - Uncomment the query import
   - Uncomment all migration functions
   - Remove the temporary console.log messages

3. Install required dependencies:
```bash
npm install mysql2 dotenv
```

4. Configure your environment:
```bash
cp .env.example .env
# Edit .env with your RDS credentials
```

## Initial AWS RDS Setup

### 1. Create RDS Instance
1. Go to AWS Console and navigate to RDS
2. Click "Create database"
3. Choose the following settings:
   - Method: Standard create
   - Engine type: MySQL
   - Version: MySQL 8.0.28 or later
   - Templates: Free tier
   - DB instance identifier: kappy-db
   - Master username: admin
   - Master password: [Create a strong password]

4. Configure Instance:
   - Instance: db.t3.micro (free tier)
   - Storage: 20 GB (minimum)
   - Enable storage autoscaling: Yes
   - Maximum storage threshold: 1000 GB

5. Connectivity:
   - VPC: Default VPC
   - Subnet group: Default
   - Public access: Yes (for development)
   - VPC security group: Create new
   - Availability Zone: No preference
   - Database port: 3306

6. Database authentication:
   - Password authentication

7. Additional configuration:
   - Initial database name: kappy_db
   - Backup retention: 7 days
   - Enable encryption: Yes

8. Click "Create database"

### 2. Configure Security Group
1. Go to EC2 > Security Groups
2. Find the security group created for your RDS
3. Add inbound rule:
   - Type: MySQL/Aurora
   - Port: 3306
   - Source: Your IP address
   - Description: Development access

## Local Environment Setup

### 1. Install Required Dependencies
```bash
# Install MySQL2 and other dependencies
npm install mysql2 dotenv
```

### 2. Configure Environment Variables
1. Copy the example env file:
```bash
cp .env.example .env
```

2. Update `.env` with your RDS details:
```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=kappy_db
```

## Database Migration Process

### 1. Create Database Tables
1. Connect to your RDS instance using MySQL Workbench:
   - Hostname: Your RDS endpoint
   - Username: admin
   - Password: Your password
   - Port: 3306
   - Database: kappy_db

2. Run the schema script:
```sql
-- Copy and paste the contents of data/schema.sql
CREATE TABLE IF NOT EXISTS products (
    -- ... schema contents
);

CREATE TABLE IF NOT EXISTS users (
    -- ... schema contents
);

-- ... other table creations
```

### 2. Migrate JSON Data to MySQL

1. Ensure your data files are up to date:
   - `/data/products.json`
   - `/data/users.json`

2. Run the migration script:
```bash
# From project root
node scripts/migrate-data.js
```

3. Verify the migration:
```sql
-- Connect to MySQL and run:
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;
```

## Updating Data in RDS

### Method 1: Using Migration Script
1. Update the JSON files in the `/data` directory
2. Clear existing data (if needed):
```sql
TRUNCATE TABLE products;
TRUNCATE TABLE users;
```
3. Run the migration script again:
```bash
node scripts/migrate-data.js
```

### Method 2: Direct SQL Updates
1. Connect to RDS using MySQL Workbench
2. Run your SQL commands:
```sql
-- Add new product
INSERT INTO products (name, price, ...) VALUES ('New Product', 29.99, ...);

-- Update existing product
UPDATE products SET price = 39.99 WHERE id = 1;

-- Delete product
DELETE FROM products WHERE id = 1;
```

## Troubleshooting

### Connection Issues
1. Verify your `.env` file has correct credentials
2. Check security group inbound rules
3. Test connection:
```bash
mysql -h your-rds-endpoint -u admin -p
```

### Migration Errors
1. Check the error message in console
2. Verify JSON data format
3. Ensure database schema matches JSON structure
4. Common fixes:
```sql
-- Reset auto-increment
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Check for duplicate entries
SELECT id, COUNT(*) FROM products GROUP BY id HAVING COUNT(*) > 1;
```

## Backup and Restore

### Create Manual Backup
1. Go to AWS RDS Console
2. Select your database
3. Actions > Take snapshot
4. Name your snapshot and create

### Restore from Backup
1. Go to AWS RDS Console
2. Navigate to Snapshots
3. Select your snapshot
4. Actions > Restore snapshot
5. Configure new instance settings
6. Update application `.env` with new endpoint

## Best Practices

1. Always backup before major changes
2. Test migrations on development environment first
3. Keep JSON files as backup
4. Document any schema changes
5. Use transactions for multiple related updates
6. Regular monitoring of:
   - Database size
   - Connection count
   - Query performance
   - Error logs

## Security Notes

1. Never commit `.env` file
2. Rotate database passwords regularly
3. Limit IP addresses in security group
4. Use SSL/TLS for database connections
5. Regular security audits
6. Monitor AWS CloudTrail for RDS events

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### User Roles
- `admin`: Full system access and management capabilities
- `customer`: Standard user privileges (default role for new registrations)

### JSON Data Structure
```json
{
    "users": [
        {
            "id": number,
            "email": string,
            "name": string,
            "password": string (bcrypt hashed),
            "role": "admin" | "customer",
            "createdAt": ISO timestamp,
            "updatedAt": ISO timestamp,
            "orders": array,
            "cart": array
        }
    ],
    "lastId": number
}
``` 