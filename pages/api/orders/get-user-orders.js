import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { readJsonFile } from '../../../utils/jsonOperations';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Read orders from orders.json
        const { orders = [] } = await readJsonFile('orders.json');

        // Filter orders for the current user
        const userOrders = orders.filter(order => order.userId === session.user.id);

        // Sort orders by creation date (newest first)
        userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ orders: userOrders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
} 