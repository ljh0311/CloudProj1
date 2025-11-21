import { executeQuery } from './postgres';
import { pool } from './postgres';

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
            return { 
                success: false, 
                error: 'Failed to fetch products',
                details: result.details,
                suggestion: result.details?.suggestion || 'Check database connection and try again'
            };
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
        return { 
            success: false, 
            error: 'Failed to fetch products',
            details: { message: error.message },
            suggestion: 'Check database connection and try again'
        };
    }
}

export async function getProductById(id) {
    const result = await executeQuery('SELECT *, CAST(price AS DECIMAL(10,2)) as price FROM products WHERE id = $1', [id]);
    if (!result.success) {
        console.error('Error fetching product from PostgreSQL:', result.error);
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
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
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
    return { success: true, data: { id: result.data[0].id, ...productData } };
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
    const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.success) {
        console.error('Error fetching user from PostgreSQL:', result.error);
        return { success: false, error: 'Failed to fetch user' };
    }
    console.log('Database query result:', result.data ? 'User found' : 'No user found');
    return result.data[0] ? { success: true, data: result.data[0] } : { success: false, error: 'User not found' };
}

export async function createUser(userData) {
    const result = await executeQuery(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at',
        [userData.name, userData.email, userData.password, userData.role || 'customer']
    );
    
    if (!result.success) {
        console.error('Error creating user:', result.error);
        return { success: false, error: 'Failed to create user' };
    }

    return { 
        success: true, 
        data: result.data[0]
    };
}

// Orders
export async function getOrders(userId = null) {
    const query = userId 
        ? 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM orders ORDER BY created_at DESC';
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
            'SELECT id FROM users WHERE id = $1',
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
        const client = await pool.connect();
        await client.query('BEGIN');

        try {
            // Insert order
            const orderResult = await client.query(
                `INSERT INTO orders (
                    user_id, order_number, items, subtotal, tax, shipping, total,
                    status, shipping_address, billing_address, payment_method, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id`,
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
                id: orderResult.rows[0].id,
                orderNumber: orderData.orderNumber,
                userId: orderData.userId
            });

            // Update product stock levels
            for (const item of orderData.items) {
                if (!item.id || !item.size || !item.quantity) {
                    throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
                }

                const stockResult = await client.query(
                    `UPDATE products 
                     SET size_${item.size.toLowerCase()}_stock = size_${item.size.toLowerCase()}_stock - $1
                     WHERE id = $2 AND size_${item.size.toLowerCase()}_stock >= $1`,
                    [parseInt(item.quantity), item.id]
                );

                if (stockResult.rowCount === 0) {
                    throw new Error(`Insufficient stock for product ${item.id} size ${item.size}`);
                }

                console.log('Stock updated successfully', {
                    product_id: item.id,
                    size: item.size,
                    quantity: item.quantity
                });
            }

            // Commit transaction
            await client.query('COMMIT');
            console.log('Transaction committed successfully');

            // Fetch the created order
            const orderRows = await client.query(
                `SELECT id, user_id, order_number, items, subtotal, tax, shipping, total,
                        status, shipping_address, billing_address, payment_method, notes,
                        created_at, updated_at
                 FROM orders WHERE id = $1`,
                [orderResult.rows[0].id]
            );

            const order = orderRows.rows[0];
            return {
                success: true,
                data: {
                    ...order,
                    items: JSON.parse(order.items),
                    shippingAddress: JSON.parse(order.shipping_address),
                    billingAddress: JSON.parse(order.billing_address),
                    paymentMethod: JSON.parse(order.payment_method)
                }
            };
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Order creation failed, transaction rolled back:', error);
            throw error;
        } finally {
            client.release();
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id`,
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

        return { success: true, data: { id: result.data[0].id, ...productData } };
    } catch (error) {
        console.error('Error in addProduct:', error);
        return { success: false, error: 'Failed to add product' };
    }
}

export async function updateProduct(productId, productData) {
    try {
        const result = await executeQuery(
            `UPDATE products 
             SET name = $1, price = $2, category = $3, image = $4,
                 material = $5, description = $6,
                 size_s_stock = $7, size_m_stock = $8, size_l_stock = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10`,
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
            'DELETE FROM products WHERE id = $1',
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
