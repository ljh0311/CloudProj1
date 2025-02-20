import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
        // Drop existing tables if they exist
        console.log('Dropping existing tables...');
        await connection.execute('DROP TABLE IF EXISTS orders');
        await connection.execute('DROP TABLE IF EXISTS products');
        await connection.execute('DROP TABLE IF EXISTS users');

        // Create users table
        console.log('Creating users table...');
        await connection.execute(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'customer') DEFAULT 'customer',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create products table
        console.log('Creating products table...');
        await connection.execute(`
            CREATE TABLE products (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
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
        console.log('Creating orders table...');
        await connection.execute(`
            CREATE TABLE orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                orderNumber VARCHAR(20) UNIQUE NOT NULL,
                items JSON NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                tax DECIMAL(10,2) NOT NULL,
                shipping DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                shippingAddress JSON NOT NULL,
                billingAddress JSON NOT NULL,
                paymentMethod JSON NOT NULL,
                notes TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);

        // Load data from JSON files
        console.log('Loading data from JSON files...');
        const usersData = await readJsonFile('users');
        const productsData = await readJsonFile('products');
        const ordersData = await readJsonFile('orders');

        if (usersData && usersData.users) {
            console.log('Inserting users...');
            for (const user of usersData.users) {
                await connection.execute(
                    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                    [user.id, user.name, user.email, user.password, user.role]
                );
            }
        }

        if (productsData && productsData.products) {
            console.log('Inserting products...');
            for (const product of productsData.products) {
                await connection.execute(
                    `INSERT INTO products (
                        id, name, price, category, image, material, description,
                        size_s_stock, size_m_stock, size_l_stock
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        product.id, product.name, product.price, product.category,
                        product.image, product.material, product.description,
                        product.size_s_stock || 0, product.size_m_stock || 0, product.size_l_stock || 0
                    ]
                );
            }
        }

        if (ordersData && ordersData.orders) {
            console.log('Inserting orders...');
            for (const order of ordersData.orders) {
                await connection.execute(
                    `INSERT INTO orders (
                        id, userId, orderNumber, items, subtotal, tax, shipping, total,
                        status, shippingAddress, billingAddress, paymentMethod, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        order.id, order.userId, order.orderNumber, JSON.stringify(order.items),
                        order.subtotal, order.tax, order.shipping, order.total,
                        order.status, JSON.stringify(order.shippingAddress),
                        JSON.stringify(order.billingAddress || order.shippingAddress),
                        JSON.stringify(order.paymentMethod),
                        order.notes || ''
                    ]
                );
            }
        }

        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the initialization
initializeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }); 