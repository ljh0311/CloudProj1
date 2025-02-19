const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Use DB_ prefix to match your .env file
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'KappyAdmin',
    database: process.env.DB_NAME || 'kappy_db',
    // Remove socketPath as MySQL uses default socket location
};

console.log('Using database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database
    // Don't log the password
});

async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

async function createDatabase() {
    // First connect without database selected
    const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
    });

    try {
        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log('Database created or already exists');

        // Use the database
        await connection.query(`USE ${dbConfig.database}`);

        // Drop existing tables if they exist
        await connection.query(`DROP TABLE IF EXISTS orders`);
        await connection.query(`DROP TABLE IF EXISTS users`);
        await connection.query(`DROP TABLE IF EXISTS products`);

        // Create users table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'customer',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create products table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
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

        // Create orders table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                items JSON NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);

        console.log('All tables created successfully');
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

async function syncData() {
    let connection;
    try {
        // First create/update database schema
        await createDatabase();
        console.log('Database schema updated');

        // Connect to MySQL
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Read JSON files
        const usersData = await readJsonFile(path.join(process.cwd(), 'data', 'users.json'));
        const productsData = await readJsonFile(path.join(process.cwd(), 'data', 'products.json'));
        const ordersData = await readJsonFile(path.join(process.cwd(), 'data', 'orders.json'));

        // Begin transaction
        await connection.beginTransaction();

        // Sync Users
        if (usersData && usersData.users) {
            for (const user of usersData.users) {
                const [existingUser] = await connection.execute(
                    'SELECT id FROM users WHERE id = ?',
                    [user.id]
                );

                if (existingUser.length === 0) {
                    await connection.execute(
                        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                        [user.id, user.name, user.email, user.password, user.role]
                    );
                } else {
                    await connection.execute(
                        'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
                        [user.name, user.email, user.password, user.role, user.id]
                    );
                }
            }
        }

        // Sync Products
        if (productsData && productsData.products) {
            for (const product of productsData.products) {
                const [existingProduct] = await connection.execute(
                    'SELECT id FROM products WHERE id = ?',
                    [product.id]
                );

                if (existingProduct.length === 0) {
                    await connection.execute(
                        'INSERT INTO products (id, name, price, category, image, material, description, size_s_stock, size_m_stock, size_l_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [product.id, product.name, product.price, product.category, product.image, product.material, product.description, product.size_s_stock, product.size_m_stock, product.size_l_stock]
                    );
                } else {
                    await connection.execute(
                        'UPDATE products SET name = ?, price = ?, category = ?, image = ?, material = ?, description = ?, size_s_stock = ?, size_m_stock = ?, size_l_stock = ? WHERE id = ?',
                        [product.name, product.price, product.category, product.image, product.material, product.description, product.size_s_stock, product.size_m_stock, product.size_l_stock, product.id]
                    );
                }
            }
        }

        // Sync Orders
        if (ordersData && ordersData.orders) {
            for (const order of ordersData.orders) {
                const [existingOrder] = await connection.execute(
                    'SELECT id FROM orders WHERE id = ?',
                    [order.id]
                );

                if (existingOrder.length === 0) {
                    await connection.execute(
                        'INSERT INTO orders (id, userId, items, total, status) VALUES (?, ?, ?, ?, ?)',
                        [order.id, order.userId, JSON.stringify(order.items), order.total, order.status]
                    );
                } else {
                    await connection.execute(
                        'UPDATE orders SET userId = ?, items = ?, total = ?, status = ? WHERE id = ?',
                        [order.userId, JSON.stringify(order.items), order.total, order.status, order.id]
                    );
                }
            }
        }

        // Commit transaction
        await connection.commit();
        console.log('Data synchronization completed successfully');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error during synchronization:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the sync
syncData(); 