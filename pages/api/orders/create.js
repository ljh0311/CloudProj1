import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createOrder } from '../../../lib/db-service';
import { pool } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Log session data for debugging
        console.log('Session data:', { 
            userId: session.user.id,
            email: session.user.email,
            user: session.user
        });

        const { items, subtotal, tax, shipping, total, status, shipping_address, billing_address, payment_method } = req.body;
        console.log('Order request data:', { 
            itemsCount: items?.length,
            total,
            status
        });

        if (!items || !total) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify user exists in database
        const [userExists] = await pool.execute(
            'SELECT id FROM users WHERE id = ?',
            [session.user.id]
        );

        if (!userExists || userExists.length === 0) {
            console.error('User not found in database:', session.user.id);
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user account'
            });
        }

        // Create order in database
        const orderData = {
            userId: session.user.id,
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            items: items.map(item => ({
                id: item.id,
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
            status: status || 'pending',
            shippingAddress: shipping_address || {},
            billingAddress: billing_address || {},
            paymentMethod: payment_method || {
                type: 'card',
                status: 'completed'
            },
            notes: ''
        };

        console.log('Creating order with data:', {
            orderNumber: orderData.orderNumber,
            userId: orderData.userId,
            total: orderData.total,
            itemsCount: orderData.items.length
        });

        const result = await createOrder(orderData);

        if (!result.success) {
            console.error('Failed to create order:', result.error);
            throw new Error(result.error || 'Failed to create order');
        }

        console.log('Order created successfully:', {
            id: result.data.id,
            orderNumber: result.data.orderNumber
        });

        res.status(201).json({
            success: true,
            order: result.data
        });
    } catch (error) {
        console.error('Error in order creation:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
} 