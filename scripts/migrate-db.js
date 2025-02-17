/**
 * Consolidated Database Migration Script for KAPPY Project
 * 
 * This script handles:
 * 1. Migration of JSON data to AWS RDS MySQL
 * 2. Creation of database tables with proper schema
 * 3. Backup of original JSON files
 * 4. Detailed logging and error handling
 * 
 * Prerequisites:
 * 1. AWS RDS MySQL instance must be running
 * 2. Environment variables must be configured
 * 3. JSON data files must exist in data/ directory
 * 
 * Required Environment Variables:
 * - DB_HOST: RDS endpoint
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

/**
 * Creates database tables if they don't exist
 * @param {mysql.Connection} connection - MySQL connection object
 */
async function createTables(connection) {
  console.log('Creating/verifying database tables...');

  // Create users table with updated role enum and additional fields
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password VARCHAR(255),
      role ENUM('customer', 'admin') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      cart JSON DEFAULT (JSON_ARRAY()),
      orders JSON DEFAULT (JSON_ARRAY())
    )
  `);
  console.log('✓ Users table ready');

  // Create products table with updated fields
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100),
      image VARCHAR(255),
      size_s_stock INT DEFAULT 20,
      size_m_stock INT DEFAULT 20,
      size_l_stock INT DEFAULT 20,
      material VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Products table ready');

  // Create orders table with updated structure
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      status VARCHAR(50) DEFAULT 'pending',
      total_amount DECIMAL(10, 2) NOT NULL,
      items JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log('✓ Orders table ready');
}

/**
 * Creates a backup of JSON data files
 */
async function backupJsonFiles() {
  console.log('Creating backup of JSON files...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../data/backups');
  
  await fs.mkdir(backupDir, { recursive: true });
  
  const filesToBackup = ['users.json', 'products.json'];
  
  for (const file of filesToBackup) {
    try {
      await fs.copyFile(
        path.join(__dirname, '../data', file),
        path.join(backupDir, `${file.replace('.json', '')}-${timestamp}.json`)
      );
      console.log(`✓ Backed up ${file}`);
    } catch (error) {
      console.warn(`⚠ Warning: Could not backup ${file}:`, error.message);
    }
  }
}

/**
 * Migrates data from JSON files to MySQL database
 */
async function migrateData() {
  let connection;
  try {
    // Create backup first
    await backupJsonFiles();

    // Establish database connection
    console.log('\nConnecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Database connected');

    // Create database schema
    await createTables(connection);

    // Read JSON files
    console.log('\nReading data files...');
    const { users } = JSON.parse(
      await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8')
    );
    const { products } = JSON.parse(
      await fs.readFile(path.join(__dirname, '../data/products.json'), 'utf8')
    );
    const { orders } = JSON.parse(
      await fs.readFile(path.join(__dirname, '../data/orders.json'), 'utf8')
    );

    // Migrate users
    console.log('\nMigrating users...');
    for (const user of users) {
      try {
        await connection.execute(
          'INSERT INTO users (id, email, name, password, role, cart, orders, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            user.id,
            user.email,
            user.name,
            user.password,
            user.role,
            JSON.stringify(user.cart || []),
            JSON.stringify(user.orders || []),
            user.createdAt || new Date().toISOString(),
            user.updatedAt || new Date().toISOString()
          ]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.warn(`⚠ Skipping duplicate user: ${user.email}`);
        } else {
          throw error;
        }
      }
    }
    console.log(`✓ ${users.length} users processed`);

    // Migrate products
    console.log('\nMigrating products...');
    for (const product of products) {
      try {
        await connection.execute(
          `INSERT INTO products (
            id, name, description, price, category, image,
            size_s_stock, size_m_stock, size_l_stock, material,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id,
            product.name,
            product.description,
            product.price,
            product.category,
            product.image,
            product.size_s_stock || 20,
            product.size_m_stock || 20,
            product.size_l_stock || 20,
            product.material,
            product.createdAt || new Date().toISOString(),
            product.updatedAt || new Date().toISOString()
          ]
        );
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.warn(`⚠ Skipping duplicate product: ${product.name}`);
        } else {
          throw error;
        }
      }
    }
    console.log(`✓ ${products.length} products processed`);

    // Migrate orders
    if (orders && orders.length > 0) {
      console.log('\nMigrating orders...');
      for (const order of orders) {
        try {
          await connection.execute(
            'INSERT INTO orders (id, user_id, status, total_amount, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              order.id,
              order.user_id,
              order.status || 'pending',
              order.total_amount,
              JSON.stringify(order.items || []),
              order.created_at || new Date().toISOString(),
              order.updated_at || new Date().toISOString()
            ]
          );
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.warn(`⚠ Skipping duplicate order: ${order.id}`);
          } else {
            throw error;
          }
        }
      }
      console.log(`✓ ${orders.length} orders processed`);
    } else {
      console.log('ℹ No orders to migrate');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Verify environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please ensure all required variables are set in your .env file');
  process.exit(1);
}

// Run migration
console.log('🚀 Starting database migration process...');
migrateData().catch(error => {
  console.error('\n❌ Fatal error during migration:', error);
  process.exit(1);
}); 