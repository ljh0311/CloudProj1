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

const dbOperations = {
    async readJSONFile(type) {
        try {
            const filePath = path.join(process.cwd(), 'data', `${type}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return { success: true, data: JSON.parse(data) };
        } catch (error) {
            console.error(`Error reading ${type}.json:`, error);
            return { success: false, error: error.message };
        }
    },

    async writeJSONFile(type, data) {
        try {
            const filePath = path.join(process.cwd(), 'data', `${type}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (error) {
            console.error(`Error writing ${type}.json:`, error);
            return { success: false, error: error.message };
        }
    }
};

// Helper function to execute MySQL queries with JSON fallback
async function executeQuery(query, params = [], jsonFallback = null) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('MySQL Error:', error);
        if (jsonFallback) {
            console.log('Falling back to JSON data');
            const jsonData = await dbOperations.readJSONFile(jsonFallback);
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
            const jsonOrders = await dbOperations.readJSONFile('orders');
            if (jsonOrders.success) {
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
                jsonOrders.data.orders.push(newOrder);
                jsonOrders.data.lastId = result.insertId;
                jsonOrders.data.lastOrderNumber = orderNumber;
                await dbOperations.writeJSONFile('orders', jsonOrders.data);
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
        const jsonOrders = await dbOperations.readJSONFile('orders');
        if (jsonOrders.success) {
            const orderNumber = `ORD-${(parseInt(jsonOrders.data.lastOrderNumber.split('-')[1]) + 1).toString().padStart(4, '0')}`;
            const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.07;
            const shipping = 5.99;
            const total = subtotal + tax + shipping;

            const newOrder = {
                ...orderData,
                id: jsonOrders.data.lastId + 1,
                orderNumber,
                subtotal,
                tax,
                shipping,
                total,
                status: orderData.status || 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            jsonOrders.data.orders.push(newOrder);
            jsonOrders.data.lastId = newOrder.id;
            jsonOrders.data.lastOrderNumber = orderNumber;
            await dbOperations.writeJSONFile('orders', jsonOrders.data);
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
        const jsonProducts = await dbOperations.readJSONFile('products');
        if (jsonProducts.success) {
            const index = jsonProducts.data.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                jsonProducts.data.products[index] = {
                    ...jsonProducts.data.products[index],
                    ...productData,
                    updatedAt: new Date().toISOString()
                };
                await dbOperations.writeJSONFile('products', jsonProducts.data);
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
        const jsonUsers = await dbOperations.readJSONFile('users');
        if (jsonUsers.success) {
            const index = jsonUsers.data.users.findIndex(u => u.id === userId);
            if (index !== -1) {
                jsonUsers.data.users[index] = {
                    ...jsonUsers.data.users[index],
                    ...userData,
                    updatedAt: new Date().toISOString()
                };
                await dbOperations.writeJSONFile('users', jsonUsers.data);
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
        const jsonOrders = await dbOperations.readJSONFile('orders');
        if (jsonOrders.success) {
            const index = jsonOrders.data.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                jsonOrders.data.orders[index].status = status;
                jsonOrders.data.orders[index].updatedAt = new Date().toISOString();
                await dbOperations.writeJSONFile('orders', jsonOrders.data);
            }
        }

        return result;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

export async function readJsonFile(type) {
    try {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error(`Error reading ${type}.json:`, error);
        return { success: false, error: error.message };
    }
}

export async function writeJsonFile(type, data) {
    try {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        console.error(`Error writing ${type}.json:`, error);
        return { success: false, error: error.message };
    }
}

export default {
    readJsonFile,
    writeJsonFile
}; 