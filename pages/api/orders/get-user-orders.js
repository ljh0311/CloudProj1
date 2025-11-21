import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getOrders } from '../../../lib/db-service-postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Fetch orders from MySQL database for the current user
        const result = await getOrders(session.user.id);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch orders');
        }

        // Sort orders by creation date (newest first)
        const userOrders = result.data.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.status(200).json({ orders: userOrders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
} 