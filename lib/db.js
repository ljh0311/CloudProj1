import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to read JSON files
export async function readJsonFile(filename) {
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

// Function to generate order number
async function generateOrderNumber() {
    const [result] = await pool.execute('SELECT MAX(orderNumber) as lastOrder FROM orders');
    const lastOrder = result[0].lastOrder || 'ORD-0000';
    const orderNum = parseInt(lastOrder.split('-')[1]) + 1;
    return `ORD-${orderNum.toString().padStart(4, '0')}`;
}

// Function to create a new order
export async function createOrder(orderData) {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Generate order number
            const orderNumber = await generateOrderNumber();

            // Calculate totals
            const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.07; // 7% tax
            const shipping = 5.99; // Fixed shipping cost
            const total = subtotal + tax + shipping;

            // Insert into MySQL
            const [result] = await connection.execute(
                `INSERT INTO orders (
                    userId, orderNumber, items, subtotal, tax, shipping, total,
                    status, shippingAddress, billingAddress, paymentMethod, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderData.userId,
                    orderNumber,
                    JSON.stringify(orderData.items),
                    subtotal,
                    tax,
                    shipping,
                    total,
                    orderData.status || 'pending',
                    JSON.stringify(orderData.shippingAddress),
                    JSON.stringify(orderData.billingAddress || orderData.shippingAddress),
                    JSON.stringify(orderData.paymentMethod),
                    orderData.notes || ''
                ]
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
                    orderNumber,
                    subtotal,
                    tax,
                    shipping,
                    total,
                    status: orderData.status || 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                jsonOrders.orders.push(newOrder);
                jsonOrders.lastId = result.insertId;
                jsonOrders.lastOrderNumber = orderNumber;
                await writeJsonFile('orders.json', jsonOrders);
            }

            return { 
                ...orderData, 
                id: result.insertId,
                orderNumber,
                subtotal,
                tax,
                shipping,
                total
            };
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
            const orderNumber = `ORD-${(parseInt(jsonOrders.lastOrderNumber.split('-')[1]) + 1).toString().padStart(4, '0')}`;
            const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.07;
            const shipping = 5.99;
            const total = subtotal + tax + shipping;

            const newOrder = {
                ...orderData,
                id: jsonOrders.lastId + 1,
                orderNumber,
                subtotal,
                tax,
                shipping,
                total,
                status: orderData.status || 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            jsonOrders.orders.push(newOrder);
            jsonOrders.lastId = newOrder.id;
            jsonOrders.lastOrderNumber = orderNumber;
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

// Function to update order status
export async function updateOrderStatus(orderId, status) {
    try {
        const [result] = await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, orderId]
        );

        // Update JSON as backup
        const jsonOrders = await readJsonFile('orders.json');
        if (jsonOrders) {
            const index = jsonOrders.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                jsonOrders.orders[index].status = status;
                jsonOrders.orders[index].updatedAt = new Date().toISOString();
                await writeJsonFile('orders.json', jsonOrders);
            }
        }

        return result;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

// Export all functions
export default {
    pool,
    getUsers,
    getProducts,
    getOrders,
    createOrder,
    updateProduct,
    updateUser,
    updateOrderStatus,
    readJsonFile
}; 