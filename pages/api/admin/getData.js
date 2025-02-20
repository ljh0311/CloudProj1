import { getSession } from 'next-auth/react';
import { getProducts, getUsers, getOrders } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const [productsResult, usersResult, ordersResult] = await Promise.all([
            getProducts(),
            getUsers(),
            getOrders()
        ]);

        if (!productsResult.success || !usersResult.success || !ordersResult.success) {
            throw new Error('Failed to fetch data');
        }

        res.status(200).json({
            products: productsResult.data,
            users: usersResult.data,
            orders: ordersResult.data
        });
    } catch (error) {
        console.error('Error in getData:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 