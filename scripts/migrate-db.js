require('dotenv').config({ path: '.env.production' });
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

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

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true // Enable multiple statements
};

/**
 * Creates database tables if they don't exist
 * @param {mysql.Connection} connection - MySQL connection object
 */
async function createTables(connection) {
  console.log('Creating/verifying database tables...');

  // Create users table
  console.log('📊 Creating users table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer', 'admin') DEFAULT 'customer',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create products table
  console.log('📊 Creating products table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image VARCHAR(255),
      material VARCHAR(100),
      description TEXT,
      size_s_stock INT DEFAULT 0,
      size_m_stock INT DEFAULT 0,
      size_l_stock INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create orders table
  console.log('📊 Creating orders table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      orderNumber VARCHAR(50) UNIQUE NOT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax DECIMAL(10, 2) NOT NULL,
      shipping DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
      shippingAddress JSON NOT NULL,
      billingAddress JSON NOT NULL,
      paymentMethod JSON NOT NULL,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create sessions table for NextAuth
  console.log('📊 Creating sessions table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      expires TIMESTAMP NOT NULL,
      sessionToken VARCHAR(255) UNIQUE NOT NULL,
      accessToken VARCHAR(255) UNIQUE NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create verification requests table for NextAuth
  console.log('📊 Creating verification requests table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS verification_requests (
      id VARCHAR(36) PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires TIMESTAMP NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Import initial data if tables are empty
  console.log('📥 Checking for initial data...');
  
  // Check if users table is empty
  const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
  if (userCount[0].count === 0) {
    console.log('➕ Adding default admin user...');
    await connection.execute(`
      INSERT INTO users (name, email, password, role) VALUES 
      ('Admin', 'admin@kappy.com', '$2b$10$K7L6gRuGiL6RzLGIGQ8xdOqD8Ql7SkUQEX1yZkJHYPqm6wQVBFjqO', 'admin')
    `);
  }

  // Check if products table is empty
  const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
  if (productCount[0].count === 0) {
    console.log('➕ Adding sample products...');
    await connection.execute(`
      INSERT INTO products (name, price, category, material, description, size_s_stock, size_m_stock, size_l_stock) VALUES 
      ('Classic Black Tee', 29.99, 'Basic Tees', '100% Cotton', 'Classic black t-shirt', 50, 50, 50),
      ('Vintage Rock Band Tee', 39.99, 'Band Tees', '100% Cotton', 'Vintage style rock band t-shirt', 30, 30, 30)
    `);
  }

  console.log('✅ Database migration completed successfully!');

  // Display table information
  const tables = ['users', 'products', 'orders', 'sessions', 'verification_requests'];
  console.log('\n📊 Table Information:');
  for (const table of tables) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`${table}: ${rows[0].count} rows`);
  }
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
          'INSERT INTO users (id, email, name, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            user.id,
            user.email,
            user.name,
            user.password,
            user.role,
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
            id, name, price, category, image, material, description,
            size_s_stock, size_m_stock, size_l_stock, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id,
            product.name,
            product.price,
            product.category,
            product.image,
            product.material,
            product.description,
            product.size_s_stock || 0,
            product.size_m_stock || 0,
            product.size_l_stock || 0,
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
            'INSERT INTO orders (id, userId, orderNumber, items, subtotal, tax, shipping, total, status, shippingAddress, billingAddress, paymentMethod, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              order.id,
              order.userId,
              order.orderNumber,
              JSON.stringify(order.items || []),
              order.subtotal,
              order.tax,
              order.shipping,
              order.total,
              order.status || 'pending',
              JSON.stringify(order.shippingAddress || {}),
              JSON.stringify(order.billingAddress || {}),
              JSON.stringify(order.paymentMethod || {}),
              order.notes,
              order.createdAt || new Date().toISOString(),
              order.updatedAt || new Date().toISOString()
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