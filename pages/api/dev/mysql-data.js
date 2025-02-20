import { executeQuery } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const [products, users, orders] = await Promise.all([
            executeQuery('SELECT * FROM products'),
            executeQuery('SELECT * FROM users'),
            executeQuery('SELECT * FROM orders')
        ]);

        if (!products.success || !users.success || !orders.success) {
            throw new Error('Failed to fetch MySQL data');
        }

        res.status(200).json({
            products: products.data,
            users: users.data,
            orders: orders.data
        });
    } catch (error) {
        console.error('Error fetching MySQL data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch MySQL data',
            details: error.message 
        });
    }
} 