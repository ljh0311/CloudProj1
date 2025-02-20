import { getSession } from 'next-auth/react';
import { createOrder } from '../../../lib/db-service';
import { pool } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get user session
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        console.log('Processing order for user:', {
            userId: session.user.id,
            email: session.user.email
        });

        const { items, totalAmount, paymentStatus, cardType } = req.body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid items data' });
        }

        if (!totalAmount || typeof totalAmount !== 'number') {
            return res.status(400).json({ error: 'Invalid total amount' });
        }

        // Calculate order details
        const subtotal = totalAmount;
        const tax = totalAmount * 0.07; // 7% tax
        const shipping = totalAmount > 100 ? 0 : 10; // Free shipping over $100
        const total = subtotal + tax + shipping;

        // Prepare order data
        const orderData = {
            userId: session.user.id,
            items: items.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                image: item.image
            })),
            subtotal,
            tax,
            shipping,
            total,
            paymentMethod: {
                type: cardType,
                status: paymentStatus
            },
            shippingAddress: session.user.shippingAddress || {},
            billingAddress: session.user.billingAddress || {}
        };

        console.log('Creating order with data:', {
            userId: session.user.id,
            itemCount: items.length,
            total
        });

        // Create order in database
        const result = await createOrder(orderData);

        if (!result.success) {
            console.error('Order creation failed:', result.error);
            throw new Error(result.error || 'Failed to create order');
        }

        // Update user's orders array
        try {
            await pool.execute(
                'UPDATE users SET orders = JSON_ARRAY_APPEND(orders, "$", ?) WHERE id = ?',
                [result.data.orderNumber, session.user.id]
            );
        } catch (error) {
            console.error('Failed to update user orders array:', error);
            // Don't fail the request if this update fails
        }

        console.log('Order created successfully:', {
            orderId: result.data.id,
            orderNumber: result.data.orderNumber
        });

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: result.data.id,
                orderNumber: result.data.orderNumber,
                total: result.data.total,
                status: result.data.status
            }
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            details: error.message
        });
    }
} 