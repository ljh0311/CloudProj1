import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to read JSON files
async function readJsonFile(filename) {
    try {
        const filePath = path.join(process.cwd(), 'data', filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
}

// Helper function to write to JSON files (as backup)
async function writeJsonFile(filename, data) {
    try {
        const filePath = path.join(process.cwd(), 'data', filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
    }
}

// Generic function to execute MySQL queries with JSON fallback
async function executeQuery(query, params = [], jsonFallback = null) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('MySQL Error:', error);
        if (jsonFallback) {
            console.log('Falling back to JSON data');
            const jsonData = await readJsonFile(jsonFallback);
            return jsonData;
        }
        throw error;
    }
}

// Function to get users
export async function getUsers() {
    return executeQuery(
        'SELECT * FROM users',
        [],
        'users.json'
    );
}

// Function to get products
export async function getProducts() {
    return executeQuery(
        'SELECT * FROM products',
        [],
        'products.json'
    );
}

// Function to get orders
export async function getOrders() {
    return executeQuery(
        'SELECT * FROM orders',
        [],
        'orders.json'
    );
}

// Function to create a new order
export async function createOrder(orderData) {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert into MySQL
            const [result] = await connection.execute(
                'INSERT INTO orders (userId, items, total, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [orderData.userId, JSON.stringify(orderData.items), orderData.total, orderData.status]
            );

            // Update product stock levels
            for (const item of orderData.items) {
                await connection.execute(
                    `UPDATE products 
                     SET size_${item.size.toLowerCase()}_stock = size_${item.size.toLowerCase()}_stock - ?,
                     updatedAt = NOW()
                     WHERE id = ?`,
                    [item.quantity, item.productId]
                );
            }

            await connection.commit();

            // Also update JSON as backup
            const jsonOrders = await readJsonFile('orders.json');
            if (jsonOrders) {
                const newOrder = {
                    ...orderData,
                    id: result.insertId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                jsonOrders.orders.push(newOrder);
                jsonOrders.lastId = result.insertId;
                await writeJsonFile('orders.json', jsonOrders);
            }

            return { ...orderData, id: result.insertId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating order:', error);
        // If MySQL fails, fall back to JSON only as last resort
        const jsonOrders = await readJsonFile('orders.json');
        if (jsonOrders) {
            const newOrder = {
                ...orderData,
                id: jsonOrders.lastId + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            jsonOrders.orders.push(newOrder);
            jsonOrders.lastId = newOrder.id;
            await writeJsonFile('orders.json', jsonOrders);
            return newOrder;
        }
        throw error;
    }
}

// Function to update product
export async function updateProduct(productId, productData) {
    try {
        const [result] = await pool.execute(
            `UPDATE products 
             SET name = ?, price = ?, category = ?, image = ?, 
                 material = ?, description = ?, 
                 size_s_stock = ?, size_m_stock = ?, size_l_stock = ?,
                 updatedAt = NOW()
             WHERE id = ?`,
            [
                productData.name, productData.price, productData.category,
                productData.image, productData.material, productData.description,
                productData.size_s_stock, productData.size_m_stock, productData.size_l_stock,
                productId
            ]
        );

        // Update JSON as backup
        const jsonProducts = await readJsonFile('products.json');
        if (jsonProducts) {
            const index = jsonProducts.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                jsonProducts.products[index] = {
                    ...jsonProducts.products[index],
                    ...productData,
                    updatedAt: new Date().toISOString()
                };
                await writeJsonFile('products.json', jsonProducts);
            }
        }

        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

// Function to update user
export async function updateUser(userId, userData) {
    try {
        const [result] = await pool.execute(
            `UPDATE users 
             SET name = ?, email = ?, role = ?, updatedAt = NOW()
             WHERE id = ?`,
            [userData.name, userData.email, userData.role, userId]
        );

        // Update JSON as backup
        const jsonUsers = await readJsonFile('users.json');
        if (jsonUsers) {
            const index = jsonUsers.users.findIndex(u => u.id === userId);
            if (index !== -1) {
                jsonUsers.users[index] = {
                    ...jsonUsers.users[index],
                    ...userData,
                    updatedAt: new Date().toISOString()
                };
                await writeJsonFile('users.json', jsonUsers);
            }
        }

        return result;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

export default {
    pool,
    getUsers,
    getProducts,
    getOrders,
    createOrder,
    updateProduct,
    updateUser
}; 