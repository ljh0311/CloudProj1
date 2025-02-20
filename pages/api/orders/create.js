import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createOrder } from '../../../lib/db-service';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { items, totalAmount, paymentStatus } = req.body;

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
            userId: session.user.id,
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
            status: 'processing',
            shippingAddress: {}, // Add proper shipping address handling
            billingAddress: {}, // Add proper billing address handling
            paymentMethod: {
                type: 'card',
                status: paymentStatus
            },
            notes: ''
        };

        const result = await createOrder(orderData);

        if (!result.success) {
            throw new Error(result.error || 'Failed to create order');
        }

        res.status(201).json({
            message: 'Order created successfully',
            orderId: result.data.id,
            orderNumber: result.data.orderNumber
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
} 