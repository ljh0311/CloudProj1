const { executeQuery, getJSONData } = require('./mysql');

// Products
async function getProducts() {
    const result = await executeQuery('SELECT * FROM products');
    if (!result.success) {
        console.error('Error fetching products from MySQL:', result.error);
        // Fallback to JSON only in development
        if (process.env.NODE_ENV === 'development') {
            return await getJSONData('products');
        }
        return { success: false, error: 'Failed to fetch products' };
    }
    return result;
}

async function getProductById(id) {
    const result = await executeQuery('SELECT * FROM products WHERE id = ?', [id]);
    if (!result.success) {
        console.error('Error fetching product from MySQL:', result.error);
        if (process.env.NODE_ENV === 'development') {
            const jsonResult = await getJSONData('products');
            if (jsonResult.success) {
                const product = jsonResult.data.find(p => p.id === id);
                return product ? { success: true, data: product } : { success: false, error: 'Product not found' };
            }
        }
        return { success: false, error: 'Failed to fetch product' };
    }
    return result.data[0] ? { success: true, data: result.data[0] } : { success: false, error: 'Product not found' };
}

// Users
async function getUserByEmail(email) {
    const result = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!result.success) {
        console.error('Error fetching user from MySQL:', result.error);
        if (process.env.NODE_ENV === 'development') {
            const jsonResult = await getJSONData('users');
            if (jsonResult.success) {
                const user = jsonResult.data.find(u => u.email === email);
                return user ? { success: true, data: user } : { success: false, error: 'User not found' };
            }
        }
        return { success: false, error: 'Failed to fetch user' };
    }
    return result.data[0] ? { success: true, data: result.data[0] } : { success: false, error: 'User not found' };
}

async function createUser(userData) {
    const result = await executeQuery(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, userData.password, userData.role || 'customer']
    );
    if (!result.success) {
        console.error('Error creating user in MySQL:', result.error);
        return { success: false, error: 'Failed to create user' };
    }
    return { success: true, data: { id: result.data.insertId, ...userData } };
}

// Orders
async function getOrders(userId = null) {
    const query = userId 
        ? 'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC'
        : 'SELECT * FROM orders ORDER BY createdAt DESC';
    const params = userId ? [userId] : [];
    
    const result = await executeQuery(query, params);
    if (!result.success) {
        console.error('Error fetching orders from MySQL:', result.error);
        if (process.env.NODE_ENV === 'development') {
            const jsonResult = await getJSONData('orders');
            if (jsonResult.success) {
                const orders = userId
                    ? jsonResult.data.filter(o => o.userId === userId)
                    : jsonResult.data;
                return { success: true, data: orders };
            }
        }
        return { success: false, error: 'Failed to fetch orders' };
    }
    return result;
}

async function createOrder(orderData) {
    const result = await executeQuery(
        'INSERT INTO orders (userId, items, total, status) VALUES (?, ?, ?, ?)',
        [orderData.userId, JSON.stringify(orderData.items), orderData.total, orderData.status || 'pending']
    );
    if (!result.success) {
        console.error('Error creating order in MySQL:', result.error);
        return { success: false, error: 'Failed to create order' };
    }
    return { success: true, data: { id: result.data.insertId, ...orderData } };
}

// Development functions for dashboard
async function getDatabaseComparison() {
    const mysqlData = {
        products: await executeQuery('SELECT * FROM products'),
        users: await executeQuery('SELECT * FROM users'),
        orders: await executeQuery('SELECT * FROM orders')
    };

    const jsonData = {
        products: await getJSONData('products'),
        users: await getJSONData('users'),
        orders: await getJSONData('orders')
    };

    return {
        mysql: mysqlData,
        json: jsonData
    };
}

module.exports = {
    getProducts,
    getProductById,
    getUserByEmail,
    createUser,
    getOrders,
    createOrder,
    getDatabaseComparison
}; 