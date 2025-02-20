import { executeQuery } from './mysql';

// Products
export async function getProducts() {
    const result = await executeQuery('SELECT *, CAST(price AS DECIMAL(10,2)) as price FROM products');
    if (!result.success) {
        console.error('Error fetching products from MySQL:', result.error);
        return { success: false, error: 'Failed to fetch products' };
    }
    
    // Ensure price is a number
    if (result.data) {
        result.data = result.data.map(product => ({
            ...product,
            price: Number(product.price)
        }));
    }
    
    return result;
}

export async function getProductById(id) {
    const result = await executeQuery('SELECT *, CAST(price AS DECIMAL(10,2)) as price FROM products WHERE id = ?', [id]);
    if (!result.success) {
        console.error('Error fetching product from MySQL:', result.error);
        return { success: false, error: 'Failed to fetch product' };
    }

    if (result.data && result.data[0]) {
        result.data[0].price = Number(result.data[0].price);
        return { success: true, data: result.data[0] };
    }
    
    return { success: false, error: 'Product not found' };
}

export async function createProduct(data) {
    // Ensure price is a number before inserting
    const productData = {
        ...data,
        price: Number(data.price)
    };

    const result = await executeQuery(
        `INSERT INTO products (name, price, category, image, material, description, 
            size_s_stock, size_m_stock, size_l_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            productData.name,
            productData.price,
            productData.category,
            productData.image,
            productData.material,
            productData.description,
            productData.size_s_stock || 0,
            productData.size_m_stock || 0,
            productData.size_l_stock || 0
        ]
    );
    if (!result.success) {
        console.error('Error creating product:', result.error);
        return { success: false, error: 'Failed to create product' };
    }
    return { success: true, data: { id: result.data.insertId, ...productData } };
}

// Users
export async function getUserByEmail(email) {
    console.log('Attempting to fetch user with email:', email);
    const result = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!result.success) {
        console.error('Error fetching user from MySQL:', result.error);
        return { success: false, error: 'Failed to fetch user' };
    }
    console.log('Database query result:', result.data ? 'User found' : 'No user found');
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

    // Fetch the created user to return complete user data
    const userResult = await executeQuery(
        'SELECT id, name, email, role, createdAt, updatedAt FROM users WHERE id = ?',
        [result.data.insertId]
    );

    if (!userResult.success || !userResult.data[0]) {
        return { success: false, error: 'Failed to fetch created user' };
    }

    return { 
        success: true, 
        data: userResult.data[0]
    };
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
        `INSERT INTO orders (
            userId, orderNumber, items, subtotal, tax, shipping, total,
            status, shippingAddress, billingAddress, paymentMethod, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderData.userId,
            orderData.orderNumber,
            JSON.stringify(orderData.items),
            orderData.subtotal,
            orderData.tax,
            orderData.shipping,
            orderData.total,
            orderData.status,
            JSON.stringify(orderData.shippingAddress),
            JSON.stringify(orderData.billingAddress),
            JSON.stringify(orderData.paymentMethod),
            orderData.notes
        ]
    );

    if (!result.success) {
        console.error('Error creating order:', result.error);
        return { success: false, error: 'Failed to create order' };
    }

    // Update product stock levels
    for (const item of orderData.items) {
        const stockUpdateResult = await executeQuery(
            `UPDATE products 
             SET size_${item.size.toLowerCase()}_stock = size_${item.size.toLowerCase()}_stock - ?
             WHERE id = ?`,
            [item.quantity, item.productId]
        );

        if (!stockUpdateResult.success) {
            console.error('Error updating product stock:', stockUpdateResult.error);
            // Continue with other updates even if one fails
        }
    }

    // Fetch the created order to return complete data
    const orderResult = await executeQuery(
        'SELECT * FROM orders WHERE id = ?',
        [result.data.insertId]
    );

    if (!orderResult.success || !orderResult.data[0]) {
        return { success: false, error: 'Failed to fetch created order' };
    }

    const order = orderResult.data[0];
    return {
        success: true,
        data: {
            ...order,
            items: JSON.parse(order.items),
            shippingAddress: JSON.parse(order.shippingAddress),
            billingAddress: JSON.parse(order.billingAddress),
            paymentMethod: JSON.parse(order.paymentMethod)
        }
    };
} 