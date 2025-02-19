import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'KappyAdmin',
    database: process.env.DB_NAME || 'kappy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Products
export async function getProducts() {
    try {
        const [rows] = await pool.execute('SELECT * FROM products');
        return rows;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

export async function getProductById(id) {
    try {
        const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}

export async function updateProduct(id, data) {
    try {
        const [result] = await pool.execute(
            `UPDATE products 
             SET name = ?, price = ?, category = ?, image = ?, 
                 material = ?, description = ?, 
                 size_s_stock = ?, size_m_stock = ?, size_l_stock = ?,
                 updatedAt = NOW()
             WHERE id = ?`,
            [
                data.name, data.price, data.category, data.image,
                data.material, data.description,
                data.size_s_stock, data.size_m_stock, data.size_l_stock,
                id
            ]
        );
        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

export async function createProduct(data) {
    try {
        const [result] = await pool.execute(
            `INSERT INTO products (
                name, price, category, image, material, description,
                size_s_stock, size_m_stock, size_l_stock
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name, data.price, data.category, data.image,
                data.material, data.description,
                data.size_s_stock, data.size_m_stock, data.size_l_stock
            ]
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

export async function deleteProduct(id) {
    try {
        const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        return result;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

// Users
export async function getUserByEmail(email) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

export async function createUser(data) {
    try {
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [data.name, data.email, data.password, data.role || 'customer']
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

export async function updateUser(id, data) {
    try {
        const [result] = await pool.execute(
            `UPDATE users 
             SET name = ?, email = ?, role = ?, updatedAt = NOW()
             WHERE id = ?`,
            [data.name, data.email, data.role, id]
        );
        return result;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

export async function updateUserPassword(id, hashedPassword) {
    try {
        const [result] = await pool.execute(
            'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
            [hashedPassword, id]
        );
        return result;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
}

export async function getUsers() {
    try {
        const [rows] = await pool.execute('SELECT * FROM users');
        return rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

export async function deleteUser(id) {
    try {
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return result;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Orders
export async function createOrder(data) {
    try {
        const [result] = await pool.execute(
            `INSERT INTO orders (userId, items, total, status)
             VALUES (?, ?, ?, ?)`,
            [data.userId, JSON.stringify(data.items), data.total, data.status || 'pending']
        );
        return result.insertId;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

export async function getOrders() {
    try {
        const [rows] = await pool.execute('SELECT * FROM orders');
        return rows;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

export async function getUserOrders(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC',
            [userId]
        );
        return rows;
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw error;
    }
}

export async function updateOrderStatus(id, status) {
    try {
        const [result] = await pool.execute(
            'UPDATE orders SET status = ?, updatedAt = NOW() WHERE id = ?',
            [status, id]
        );
        return result;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

// Health check
export async function healthCheck() {
    try {
        const [result] = await pool.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

export default {
    pool,
    getProducts,
    getProductById,
    updateProduct,
    createProduct,
    deleteProduct,
    getUserByEmail,
    createUser,
    updateUser,
    updateUserPassword,
    getUsers,
    deleteUser,
    createOrder,
    getOrders,
    getUserOrders,
    updateOrderStatus,
    healthCheck
}; 