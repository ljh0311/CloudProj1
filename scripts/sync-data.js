const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

async function syncData() {
    let connection;
    try {
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
                        'INSERT INTO users (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [user.id, user.name, user.email, user.password, user.role, user.createdAt, user.updatedAt]
                    );
                } else {
                    await connection.execute(
                        'UPDATE users SET name = ?, email = ?, password = ?, role = ?, updatedAt = ? WHERE id = ?',
                        [user.name, user.email, user.password, user.role, user.updatedAt, user.id]
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
                        'INSERT INTO products (id, name, price, category, image, material, description, size_s_stock, size_m_stock, size_l_stock, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [product.id, product.name, product.price, product.category, product.image, product.material, product.description, product.size_s_stock, product.size_m_stock, product.size_l_stock, product.createdAt, product.updatedAt]
                    );
                } else {
                    await connection.execute(
                        'UPDATE products SET name = ?, price = ?, category = ?, image = ?, material = ?, description = ?, size_s_stock = ?, size_m_stock = ?, size_l_stock = ?, updatedAt = ? WHERE id = ?',
                        [product.name, product.price, product.category, product.image, product.material, product.description, product.size_s_stock, product.size_m_stock, product.size_l_stock, product.updatedAt, product.id]
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
                        'INSERT INTO orders (id, userId, items, total, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [order.id, order.userId, JSON.stringify(order.items), order.total, order.status, order.createdAt, order.updatedAt]
                    );
                } else {
                    await connection.execute(
                        'UPDATE orders SET userId = ?, items = ?, total = ?, status = ?, updatedAt = ? WHERE id = ?',
                        [order.userId, JSON.stringify(order.items), order.total, order.status, order.updatedAt, order.id]
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