import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../lib/mysql';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initializeDatabase() {
    try {
        // Create tables if they don't exist
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'customer') DEFAULT 'customer',
                shippingAddress JSON,
                billingAddress JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await executeQuery(`
            CREATE TABLE IF NOT EXISTS products (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                image VARCHAR(255),
                material VARCHAR(100),
                description TEXT,
                size_s_stock INT DEFAULT 20,
                size_m_stock INT DEFAULT 20,
                size_l_stock INT DEFAULT 20,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await executeQuery(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                orderNumber VARCHAR(50) UNIQUE NOT NULL,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `);

        // Create default admin user if not exists
        const adminEmail = 'admin@kappy.com';
        const adminResult = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (!adminResult.success || adminResult.data.length === 0) {
            console.log('Creating default admin user...');
            const adminPassword = await bcrypt.hash('admin123', 12);
            
            await executeQuery(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', adminEmail, adminPassword, 'admin']
            );
            
            console.log('Default admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase()
    .then(() => {
        console.log('Database setup completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }); 