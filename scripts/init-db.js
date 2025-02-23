const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function readJsonFile(type) {
    try {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${type}.json:`, error);
        return null;
    }
}

async function initializeDatabase() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Drop existing tables if they exist in correct order
        await connection.execute('DROP TABLE IF EXISTS orders');
        await connection.execute('DROP TABLE IF EXISTS sessions');
        await connection.execute('DROP TABLE IF EXISTS verification_requests');
        await connection.execute('DROP TABLE IF EXISTS products');
        await connection.execute('DROP TABLE IF EXISTS users');

        // Create users table
        await connection.execute(`
            CREATE TABLE users (
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
        await connection.execute(`
            CREATE TABLE products (
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
        await connection.execute(`
            CREATE TABLE orders (
                id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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

        // Add default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), 'Admin', 'admin@kappy.com', hashedPassword, 'admin']
        );

        // Add sample products
        const sampleProducts = [
            {
                id: uuidv4(),
                name: 'Street Fighter II Arcade Tee',
                price: 64.99,
                category: 'Gaming',
                material: '100% Cotton',
                description: 'Classic Street Fighter II arcade game t-shirt',
                size_s_stock: 50,
                size_m_stock: 50,
                size_l_stock: 50
            },
            {
                id: uuidv4(),
                name: 'Lakers Championship \'91 Tee',
                price: 82.99,
                category: 'Sports',
                material: '100% Cotton',
                description: 'Lakers 1991 Championship commemorative t-shirt',
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

        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

// Run initialization
console.log('Starting database initialization...');
initializeDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 