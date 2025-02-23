import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createOrder } from '../../../lib/db-service';

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

        console.log('Session data:', {
            user: session.user,
            id: session.user.id,
            email: session.user.email
        });

        // Process the order
        const orderData = {
            ...req.body,
            userId: session.user.id
        };

        console.log('Processing order with data:', orderData);

        const result = await createOrder(orderData);
        
        if (!result.success) {
            console.error('Order creation failed:', result.error);
            return res.status(500).json({ error: result.error });
        }

        return res.status(200).json(result.data);
    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({ error: error.message });
    }
} 