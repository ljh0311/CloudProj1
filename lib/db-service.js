import { executeQuery } from './mysql';

// Products
export async function getProducts() {
    const result = await executeQuery('SELECT * FROM products');
    if (!result.success) {
        console.error('Error fetching products from MySQL:', result.error);
        return { success: false, error: 'Failed to fetch products' };
    }
    return result;
}

export async function getProductById(id) {
    const result = await executeQuery('SELECT * FROM products WHERE id = ?', [id]);
    if (!result.success) {
        console.error('Error fetching product from MySQL:', result.error);
        return { success: false, error: 'Failed to fetch product' };
    }
    return result.data[0] ? { success: true, data: result.data[0] } : { success: false, error: 'Product not found' };
}

export async function createProduct(data) {
    const result = await executeQuery(
        `INSERT INTO products (name, price, category, image, material, description, 
            size_s_stock, size_m_stock, size_l_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.name, data.price, data.category, data.image, data.material, data.description,
         data.size_s_stock || 0, data.size_m_stock || 0, data.size_l_stock || 0]
    );
    if (!result.success) {
        console.error('Error creating product:', result.error);
        return { success: false, error: 'Failed to create product' };
    }
    return { success: true, data: { id: result.data.insertId, ...data } };
}

// Users
export async function getUserByEmail(email) {
    const result = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!result.success) {
        console.error('Error fetching user from MySQL:', result.error);
        return { success: false, error: 'Failed to fetch user' };
    }
    return result.data[0] ? { success: true, data: result.data[0] } : { success: false, error: 'User not found' };
}

export async function createUser(userData) {
    const result = await executeQuery(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, userData.password, userData.role || 'customer']
    );
    if (!result.success) {
        console.error('Error creating user:', result.error);
        return { success: false, error: 'Failed to create user' };
    }
    return { success: true, data: { id: result.data.insertId, ...userData } };
}

// Orders
export async function getOrders(userId = null) {
    const query = userId 
        ? 'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC'
        : 'SELECT * FROM orders ORDER BY createdAt DESC';
    const params = userId ? [userId] : [];
    
    const result = await executeQuery(query, params);
    if (!result.success) {
        console.error('Error fetching orders:', result.error);
        return { success: false, error: 'Failed to fetch orders' };
    }
    return result;
}

export async function createOrder(orderData) {
    const result = await executeQuery(
        'INSERT INTO orders (userId, items, total, status) VALUES (?, ?, ?, ?)',
        [orderData.userId, JSON.stringify(orderData.items), orderData.total, orderData.status || 'pending']
    );
    if (!result.success) {
        console.error('Error creating order:', result.error);
        return { success: false, error: 'Failed to create order' };
    }
    return { success: true, data: { id: result.data.insertId, ...orderData } };
}

// Development functions for dashboard
export async function getDatabaseComparison() {
    const mysqlData = {
        products: await executeQuery('SELECT * FROM products'),
        users: await executeQuery('SELECT * FROM users'),
        orders: await executeQuery('SELECT * FROM orders')
    };

    return {
        mysql: mysqlData,
        json: {
            products: await fetch('/api/dev/json/products').then(r => r.json()),
            users: await fetch('/api/dev/json/users').then(r => r.json()),
            orders: await fetch('/api/dev/json/orders').then(r => r.json())
        }
    };
}

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    getUserByEmail,
    createUser,
    getOrders,
    createOrder,
    getDatabaseComparison
}; 