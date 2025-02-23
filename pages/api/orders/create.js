import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createOrder } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
            return res.status(401).json({ 
                success: false,
                error: 'Not authenticated' 
            });
        }

        console.log('Session data:', { 
            user_id: session.user.id,
            email: session.user.email 
        });

        const { items, subtotal, tax, shipping, total, status, shipping_address, billing_address, payment_method } = req.body;
        
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No items in order' 
            });
        }

        if (typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid total amount' 
            });
        }

        console.log('Order request data:', { 
            itemsCount: items.length,
            total,
            status,
            user_id: session.user.id
        });

        // Create order in database
        const orderData = {
            user_id: session.user.id,
            order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
            shipping_address: shipping_address || {},
            billing_address: billing_address || {},
            payment_method: payment_method || {
                type: 'card',
                status: 'completed'
            },
            notes: ''
        };

        console.log('Creating order with data:', {
            order_number: orderData.order_number,
            user_id: orderData.user_id,
            total: orderData.total,
            itemsCount: orderData.items.length
        });

        const result = await createOrder(orderData);

        if (!result.success) {
            console.error('Failed to create order:', {
                error: result.error,
                details: result.details
            });
            return res.status(500).json({ 
                success: false,
                error: result.error,
                details: result.details
            });
        }

        console.log('Order created successfully:', {
            id: result.data.id,
            order_number: result.data.order_number
        });

        res.status(201).json({
            success: true,
            order: result.data
        });
    } catch (error) {
        console.error('Error in order creation:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            details: error.stack
        });
    }
} 