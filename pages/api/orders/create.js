import { getSession } from 'next-auth/react';
import { pool, executeQuery } from '../../../lib/mysql';
import { createOrder } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('Session data:', {
            user: session.user,
            userId: session.user.id,
            email: session.user.email
        });

        // Verify user exists in database
        const userResult = await executeQuery(
            'SELECT id FROM users WHERE id = ?',
            [session.user.id]
        );

        if (!userResult.success) {
            console.error('Database error during user verification:', userResult.error);
            return res.status(500).json({ error: 'Database error during user verification' });
        }

        if (userResult.data.length === 0) {
            console.error('User not found in database:', session.user.id);
            return res.status(400).json({ error: `User not found: ${session.user.id}` });
        }

        // Process the order
        const orderData = {
            ...req.body,
            userId: session.user.id
        };

        console.log('Processing order with data:', orderData);

        const result = await createOrder(orderData);
        
        if (!result.success) {
            console.error('Order creation failed:', result.error);
            return res.status(500).json({ error: `Payment processing error: ${result.error}` });
        }

        return res.status(200).json(result.data);
    } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({ error: `Payment processing error: ${error.message}` });
    }
} 