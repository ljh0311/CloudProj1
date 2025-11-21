import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createOrder } from '../../../lib/db-service-postgres';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        // Create order using the PostgreSQL service
        const result = await createOrder(orderData);

        if (!result.success) {
            return res.status(400).json({
                error: result.error || 'Failed to create order'
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            orderId: result.data.id,
            orderNumber: orderData.orderNumber
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
            error: error.message || 'Failed to create order'
        });
    }
} 