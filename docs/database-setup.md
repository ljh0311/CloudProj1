# Database Setup and Migration Guide

## Current Data Structure
The application uses JSON files as a backup system, with the main database being MySQL on AWS RDS. The JSON files are located in the `/data` directory:

### Static Assets
The application includes default images in `/public/images`:
- `logo3.jpg`: Application logo used in the navbar and branding
- `demoProduct.jpg`: Default product image used when no specific image is provided

When deploying to AWS, these images should be copied to the EC2 instance in the same directory structure.

### JSON Files Structure
- `/data/orders.json`: Order data
  ```json
  {
      "orders": [],
      "lastId": 0
  }
  ```

- `/data/users.json`: User data with orders and cart information
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

- `/data/products.json`: Product catalog with inventory
  ```json
  {
      "products": [
          {
              "id": number,
              "name": string,
              "price": number,
              "category": string,
              "image": string, // Defaults to "/images/demoProduct.jpg" if not specified
              "description": string,
              "material": string,
              "size_s_stock": number,
              "size_m_stock": number,
              "size_l_stock": number,
              "createdAt": ISO timestamp,
              "updatedAt": ISO timestamp
          }
      ],
      "lastId": number
  }
  ```

## AWS RDS Setup (Web Console)

### 1. Create RDS Instance
1. Log in to AWS Console and navigate to RDS
2. Click "Create database"
3. Choose settings:
   - Standard create
   - MySQL
   - Free tier template
   - DB instance identifier: `kappy-db`
   - Master username: `admin`
   - Master password: Create a strong password
   - Instance: db.t3.micro
   - Storage: 20 GB
   - Enable autoscaling
   - VPC: Default
   - Public access: Yes (for development)
   - Security group: Create new
   - Initial database name: `kappy_db`
   - Enable automated backups

### 2. Configure Security Group
1. Go to EC2 > Security Groups
2. Find the RDS security group
3. Edit inbound rules:
   - Add rule: MySQL/Aurora (3306)
   - Source: Your EC2 security group ID
   - Description: "Allow EC2 access"

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image VARCHAR(255),
    description TEXT,
    material VARCHAR(100),
    size_s_stock INT DEFAULT 20,
    size_m_stock INT DEFAULT 20,
    size_l_stock INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36),
    product_id VARCHAR(36),
    quantity INT NOT NULL,
    size ENUM('S', 'M', 'L') NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## Data Migration Process

### 1. Install MySQL Workbench
1. Download and install MySQL Workbench
2. Add new connection:
   - Hostname: Your RDS endpoint
   - Port: 3306
   - Username: admin
   - Password: Your RDS password

### 2. Create Database Tables
1. Connect to RDS through MySQL Workbench
2. Execute the schema SQL scripts above in order:
   - Users table
   - Products table
   - Orders table
   - Order Items table

### 3. Run Migration Script
```bash
# Install dependencies
npm install mysql2 dotenv

# Set up environment variables
cp .env.example .env
# Update .env with RDS credentials

# Run migration
node scripts/migrate-db.js
```

## Backup Strategy

### Automated RDS Backups
1. In RDS Console:
   - Select your DB instance
   - Modify
   - Enable automatic backups
   - Set retention period (7 days recommended)

### JSON Backup Process
1. Create backup directory:
```bash
mkdir -p data/backups
```

2. Run backup script:
```bash
# scripts/backup-json.js
const fs = require('fs').promises;
const path = require('path');

async function backupJson() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const files = ['users.json', 'products.json', 'orders.json'];
    
    for (const file of files) {
        const sourcePath = path.join(__dirname, '../data', file);
        const backupPath = path.join(__dirname, '../data/backups', `${file.replace('.json', '')}-${timestamp}.json`);
        await fs.copyFile(sourcePath, backupPath);
    }
}

backupJson();
```

## Monitoring and Maintenance

### Health Checks
1. Database connection:
```sql
SELECT 1;
```

2. Table status:
```sql
SHOW TABLE STATUS;
```

3. Connection count:
```sql
SHOW STATUS WHERE Variable_name = 'Threads_connected';
```

### Best Practices
1. Regular backups of both RDS and JSON files
2. Monitor RDS metrics in AWS Console
3. Keep JSON files as fallback
4. Document all schema changes
5. Regular security audits
6. Monitor connection limits

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