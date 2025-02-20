import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Products operations
export const getProducts = async () => {
    try {
        const [rows] = await pool.execute('SELECT * FROM products');
        return rows;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const getProductById = async (id) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

export const updateProduct = async (id, data) => {
    try {
        const [result] = await pool.execute(
            `UPDATE products 
             SET name = ?, price = ?, category = ?, image = ?, 
                 material = ?, description = ?, 
                 size_s_stock = ?, size_m_stock = ?, size_l_stock = ?
             WHERE id = ?`,
            [
                data.name,
                data.price,
                data.category,
                data.image,
                data.material,
                data.description,
                data.size_s_stock,
                data.size_m_stock,
                data.size_l_stock,
                id
            ]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

// User operations
export const getMySQLUserByEmail = async (email) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
};

export const createMySQLUser = async (userData) => {
    try {
        const { name, email, password, role = 'customer' } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return result.insertId;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
};

// Orders operations
export const createOrder = async (orderData) => {
    try {
        const {
            userId,
            orderNumber,
            items,
            subtotal,
            tax,
            shipping,
            total,
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes
        } = orderData;

        const [result] = await pool.execute(
            `INSERT INTO orders (
                user_id, order_number, items, subtotal, tax, 
                shipping, total, shipping_address, billing_address, 
                payment_method, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                orderNumber,
                JSON.stringify(items),
                subtotal,
                tax,
                shipping,
                total,
                JSON.stringify(shippingAddress),
                JSON.stringify(billingAddress),
                JSON.stringify(paymentMethod),
                notes
            ]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const getUserOrders = async (userId) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows.map(order => ({
            ...order,
            items: JSON.parse(order.items),
            shippingAddress: JSON.parse(order.shipping_address),
            billingAddress: JSON.parse(order.billing_address),
            paymentMethod: JSON.parse(order.payment_method)
        }));
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return [];
    }
};

// Health check
export const healthCheck = async () => {
    try {
        const [result] = await pool.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};

export default {
    pool,
    getProducts,
    getProductById,
    updateProduct,
    getMySQLUserByEmail,
    createMySQLUser,
    createOrder,
    getUserOrders,
    healthCheck
}; 