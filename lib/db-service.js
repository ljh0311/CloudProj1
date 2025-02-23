import { executeQuery } from './mysql';
import { pool } from './mysql';

// Products
export async function getProducts() {
    try {
        const result = await executeQuery(`
            SELECT id, name, CAST(price AS DECIMAL(10,2)) as price, 
                   category, image, material, description,
                   size_s_stock, size_m_stock, size_l_stock,
                   created_at, updated_at 
            FROM products
        `);
        
        if (!result.success) {
            console.error('Database query failed:', result.error);
            return { success: false, error: 'Failed to fetch products' };
        }
        
        // Ensure price is a number and format dates
        const formattedProducts = result.data.map(product => ({
            ...product,
            price: Number(product.price),
            created_at: new Date(product.created_at).toISOString(),
            updated_at: new Date(product.updated_at).toISOString()
        }));
        
        return { success: true, data: formattedProducts };
    } catch (error) {
        console.error('Error in getProducts:', error);
        return { success: false, error: 'Failed to fetch products' };
    }
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
export async function getUsers() {
    try {
        const result = await executeQuery(`
            SELECT id, name, email, role, created_at, updated_at 
            FROM users
            ORDER BY created_at DESC
        `);
        
        if (!result.success) {
            console.error('Failed to fetch users:', result.error);
            return { success: false, error: 'Failed to fetch users' };
        }
        
        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error in getUsers:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

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
    try {
        console.log('Starting order creation in database', { 
            userId: orderData.userId, 
            orderNumber: orderData.orderNumber 
        });
        
        // Validate required fields and ensure proper types
        const requiredFields = ['userId', 'items', 'subtotal', 'tax', 'shipping', 'total'];
        const missingFields = requiredFields.filter(field => {
            if (field === 'items') {
                return !Array.isArray(orderData[field]) || orderData[field].length === 0;
            }
            return orderData[field] === undefined || orderData[field] === null;
        });

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Verify user exists
        const userResult = await executeQuery(
            'SELECT id FROM users WHERE id = ?',
            [orderData.userId]
        );

        if (!userResult.success || userResult.data.length === 0) {
            throw new Error(`User not found: ${orderData.userId}`);
        }

        // Ensure numeric fields are numbers
        const numericFields = ['subtotal', 'tax', 'shipping', 'total'];
        numericFields.forEach(field => {
            orderData[field] = parseFloat(orderData[field]);
            if (isNaN(orderData[field])) {
                throw new Error(`Invalid numeric value for ${field}`);
            }
        });

        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert order
            const [orderResult] = await connection.execute(
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
                    orderData.status || 'pending',
                    JSON.stringify(orderData.shippingAddress || {}),
                    JSON.stringify(orderData.billingAddress || {}),
                    JSON.stringify(orderData.paymentMethod || {}),
                    orderData.notes || ''
                ]
            );

            console.log('Order record created', {
                id: orderResult.insertId,
                orderNumber: orderData.orderNumber,
                userId: orderData.userId
            });

            // Update product stock levels
            for (const item of orderData.items) {
                if (!item.id || !item.size || !item.quantity) {
                    throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                }

                const [stockResult] = await connection.execute(
                    `UPDATE products 
                     SET size_${item.size.toLowerCase()}_stock = size_${item.size.toLowerCase()}_stock - ?
                     WHERE id = ? AND size_${item.size.toLowerCase()}_stock >= ?`,
                    [parseInt(item.quantity), item.id, parseInt(item.quantity)]
                );

                if (stockResult.affectedRows === 0) {
                    throw new Error(`Insufficient stock for product ${item.id} size ${item.size}`);
                }

                console.log('Stock updated successfully', {
                    product_id: item.id,
                    size: item.size,
                    quantity: item.quantity
                });
            }

            // Commit transaction
            await connection.commit();
            console.log('Transaction committed successfully');

            // Fetch the created order
            const [orderRows] = await connection.execute(
                `SELECT id, userId, orderNumber, items, subtotal, tax, shipping, total,
                        status, shippingAddress, billingAddress, paymentMethod, notes,
                        createdAt, updatedAt
                 FROM orders WHERE id = ?`,
                [orderResult.insertId]
            );

            const order = orderRows[0];
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
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            console.error('Order creation failed, transaction rolled back:', error);
            throw error;
        } finally {
            connection.release();
            console.log('Database connection released');
        }
    } catch (error) {
        console.error('Order creation failed:', error);
        return {
            success: false,
            error: error.message,
            details: error.stack
        };
    }
}

export async function addProduct(productData) {
    try {
        const result = await executeQuery(
            `INSERT INTO products (
                name, price, category, image, material, description,
                size_s_stock, size_m_stock, size_l_stock
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productData.name,
                Number(productData.price),
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
            console.error('Failed to add product:', result.error);
            return { success: false, error: 'Failed to add product' };
        }

        return { success: true, data: { id: result.data.insertId, ...productData } };
    } catch (error) {
        console.error('Error in addProduct:', error);
        return { success: false, error: 'Failed to add product' };
    }
}

export async function updateProduct(productId, productData) {
    try {
        const result = await executeQuery(
            `UPDATE products 
             SET name = ?, price = ?, category = ?, image = ?,
                 material = ?, description = ?,
                 size_s_stock = ?, size_m_stock = ?, size_l_stock = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                productData.name,
                Number(productData.price),
                productData.category,
                productData.image,
                productData.material,
                productData.description,
                productData.size_s_stock,
                productData.size_m_stock,
                productData.size_l_stock,
                productId
            ]
        );

        if (!result.success) {
            console.error('Failed to update product:', result.error);
            return { success: false, error: 'Failed to update product' };
        }

        return { success: true, data: { id: productId, ...productData } };
    } catch (error) {
        console.error('Error in updateProduct:', error);
        return { success: false, error: 'Failed to update product' };
    }
}

export async function deleteProduct(productId) {
    try {
        const result = await executeQuery(
            'DELETE FROM products WHERE id = ?',
            [productId]
        );

        if (!result.success) {
            console.error('Failed to delete product:', result.error);
            return { success: false, error: 'Failed to delete product' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        return { success: false, error: 'Failed to delete product' };
    }
} 