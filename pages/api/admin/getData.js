import { getSession } from 'next-auth/react';
import { getProducts, getUsers, getOrders } from '../../../lib/mysql';

export default async function handler(req, res) {
    // Check if user is authenticated and is admin
    const session = await getSession({ req });
    if (!session || session.user.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { type } = req.query;

    try {
        switch (type) {
            case 'products':
                const products = await getProducts();
                res.status(200).json({ products });
                break;

            case 'users':
                const users = await getUsers();
                res.status(200).json({ users });
                break;

            case 'orders':
                const orders = await getOrders();
                res.status(200).json({ orders });
                break;

            default:
                res.status(400).json({ message: 'Invalid data type requested' });
        }
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        res.status(500).json({ message: `Error fetching ${type}` });
    }
} 