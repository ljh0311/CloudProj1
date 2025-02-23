import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { pool } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let connection;
    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session?.user?.id) {
            console.error('Unauthorized: No valid session or user ID');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const orderData = {
            ...req.body,
            userId: session.user.id
        };

        // Validate required fields
        const requiredFields = ['userId', 'orderNumber', 'items', 'subtotal', 'tax', 'shipping', 'total', 'shippingAddress', 'billingAddress', 'paymentMethod'];
        const missingFields = requiredFields.filter(field => !orderData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Get database connection and start transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Verify user exists
            const [user] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [orderData.userId]
            );

            if (user.length === 0) {
                throw new Error(`User not found: ${orderData.userId}`);
            }

            // Verify stock availability and update stock levels
            for (const item of orderData.items) {
                const sizeColumn = `size_${item.size.toLowerCase()}_stock`;
                const [stockResult] = await connection.execute(
                    `SELECT ${sizeColumn} as stock, name FROM products WHERE id = ?`,
                    [item.id]
                );

                if (stockResult.length === 0) {
                    throw new Error(`Product not found: ${item.id}`);
                }

                const currentStock = stockResult[0].stock;
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${stockResult[0].name} (Size ${item.size})`);
                }

                // Update stock level
                await connection.execute(
                    `UPDATE products 
                     SET ${sizeColumn} = ${sizeColumn} - ?
                     WHERE id = ?`,
                    [item.quantity, item.id]
                );
            }

            // Create order
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
                    JSON.stringify(orderData.shippingAddress),
                    JSON.stringify(orderData.billingAddress),
                    JSON.stringify(orderData.paymentMethod),
                    orderData.notes || ''
                ]
            );

            // Commit transaction
            await connection.commit();

            // Return success response
            return res.status(200).json({
                success: true,
                orderId: orderResult.insertId,
                orderNumber: orderData.orderNumber
            });

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to create order'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
} 