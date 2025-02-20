require('dotenv').config({ path: '.env.production' });
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * AWS RDS MySQL Migration Script for KAPPY Project
 * 
 * This script handles:
 * 1. Creation of database tables with proper schema
 * 2. Initial data population for AWS RDS
 * 
 * Required Environment Variables:
 * - DB_HOST: RDS endpoint
 * - DB_USER: Database username (admin)
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name (kappy_db)
 */

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
};

async function createTables(connection) {
  console.log('Creating/verifying database tables...');

  // Create users table
  console.log('📊 Creating users table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer', 'admin') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create products table
  console.log('📊 Creating products table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image VARCHAR(255),
      material VARCHAR(100),
      description TEXT,
      size_s_stock INT DEFAULT 0,
      size_m_stock INT DEFAULT 0,
      size_l_stock INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create orders table
  console.log('📊 Creating orders table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax DECIMAL(10, 2) NOT NULL,
      shipping DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
      shipping_address JSON NOT NULL,
      billing_address JSON NOT NULL,
      payment_method JSON NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create sessions table for NextAuth
  console.log('📊 Creating sessions table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      expires TIMESTAMP NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      access_token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create verification requests table for NextAuth
  console.log('📊 Creating verification requests table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS verification_requests (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      identifier VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Add initial data
  console.log('📥 Adding initial data...');
  
  // Add default admin user if not exists
  const [adminExists] = await connection.execute(
    'SELECT COUNT(*) as count FROM users WHERE email = ?',
    ['admin@kappy.com']
  );

  if (adminExists[0].count === 0) {
    console.log('➕ Adding default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'Admin', 'admin@kappy.com', hashedPassword, 'admin']
    );
  }

  // Add sample products if not exists
  const [productsExist] = await connection.execute('SELECT COUNT(*) as count FROM products');
  
  if (productsExist[0].count === 0) {
    console.log('➕ Adding sample products...');
    const sampleProducts = [
      {
        id: uuidv4(),
        name: 'Classic Black Tee',
        price: 29.99,
        category: 'Basic Tees',
        material: '100% Cotton',
        description: 'Classic black t-shirt perfect for any occasion',
        size_s_stock: 50,
        size_m_stock: 50,
        size_l_stock: 50
      },
      {
        id: uuidv4(),
        name: 'Vintage Rock Band Tee',
        price: 39.99,
        category: 'Band Tees',
        material: '100% Cotton',
        description: 'Vintage style rock band t-shirt',
        size_s_stock: 30,
        size_m_stock: 30,
        size_l_stock: 30
      }
    ];

    for (const product of sampleProducts) {
      await connection.execute(
        `INSERT INTO products (
          id, name, price, category, material, description,
          size_s_stock, size_m_stock, size_l_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.price,
          product.category,
          product.material,
          product.description,
          product.size_s_stock,
          product.size_m_stock,
          product.size_l_stock
        ]
      );
    }
  }

  // Display table information
  console.log('\n📊 Current table status:');
  const tables = ['users', 'products', 'orders', 'sessions', 'verification_requests'];
  for (const table of tables) {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`${table}: ${rows[0].count} rows`);
  }
}

async function initializeDatabase() {
  let connection;
  try {
    console.log('🔌 Connecting to AWS RDS MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    await createTables(connection);
    console.log('\n✅ Database initialization completed successfully!');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Verify environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please ensure all required variables are set in your .env.production file');
  process.exit(1);
}

// Run initialization
console.log('🚀 Starting AWS RDS database initialization...');
initializeDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
}); 