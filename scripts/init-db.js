import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
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
    console.log('Starting database initialization...');
    console.log('Database config:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database
    });

    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Drop existing tables if they exist
        console.log('Dropping existing tables...');
        await connection.execute('DROP TABLE IF EXISTS orders');
        await connection.execute('DROP TABLE IF EXISTS products');
        await connection.execute('DROP TABLE IF EXISTS users');

        // Create users table with updated schema
        console.log('Creating users table...');
        await connection.execute(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'customer') DEFAULT 'customer',
                shippingAddress JSON,
                billingAddress JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                lastLogin TIMESTAMP NULL,
                isActive BOOLEAN DEFAULT TRUE,
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        `);

        // Create products table with updated schema
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
                totalSales INT DEFAULT 0,
                isActive BOOLEAN DEFAULT TRUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_price (price)
            )
        `);

        // Create orders table with updated schema
        console.log('Creating orders table...');
        await connection.execute(`
            CREATE TABLE orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
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
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                INDEX idx_user (user_id),
                INDEX idx_status (status),
                INDEX idx_orderNumber (orderNumber)
            )
        `);

        // Load and insert initial data
        console.log('Loading data from JSON files...');
        const usersData = await readJsonFile('users');
        const productsData = await readJsonFile('products');

        if (usersData && usersData.users) {
            console.log('Inserting users...');
            for (const user of usersData.users) {
                // Hash password if not already hashed
                const hashedPassword = user.password.startsWith('$2') 
                    ? user.password 
                    : await bcrypt.hash(user.password, 12);

                await connection.execute(
                    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                    [user.id, user.name, user.email, hashedPassword, user.role]
                );
            }
            console.log(`Inserted ${usersData.users.length} users`);
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
                        product.size_s_stock || 20, product.size_m_stock || 20, product.size_l_stock || 20
                    ]
                );
            }
            console.log(`Inserted ${productsData.products.length} products`);
        }

        // Create default admin user if not exists
        const adminEmail = 'admin@kappy.com';
        const [adminExists] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (!adminExists.length) {
            console.log('Creating default admin user...');
            const adminPassword = await bcrypt.hash('admin123', 12);
            await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', adminEmail, adminPassword, 'admin']
            );
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
    .then(() => {
        console.log('Database setup completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }); 