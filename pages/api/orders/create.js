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
            return res.status(401).json({ message: 'Not authenticated' });
        }

        console.log('Session data:', { 
            user_id: session.user.id,
            userEmail: session.user.email 
        });

        const { items, totalAmount, paymentStatus } = req.body;
        console.log('Order request data:', { 
            itemsCount: items?.length,
            totalAmount,
            paymentStatus
        });

        if (!items || !totalAmount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Calculate order details
        const subtotal = totalAmount;
        const tax = subtotal * 0.07; // 7% tax
        const shipping = 5.99; // Fixed shipping cost
        const total = subtotal + tax + shipping;

        // Create order in database
        const orderData = {
            user_id: session.user.id,
            order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            items: items.map(item => ({
                product_id: item.id,
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
            status: 'processing',
            shipping_address: {}, // Add proper shipping address handling
            billing_address: {}, // Add proper billing address handling
            payment_method: {
                type: 'card',
                status: paymentStatus
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
            console.error('Failed to create order:', result.error);
            throw new Error(result.error || 'Failed to create order');
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
            error: error.message 
        });
    }
} 