import db from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const [users, products, orders] = await Promise.all([
            db.getUsers(),
            db.getProducts(),
            db.getOrders()
        ]);

        res.status(200).json({
            users,
            products,
            orders
        });
    } catch (error) {
        console.error('Error fetching MySQL data:', error);
        res.status(500).json({ message: 'Error fetching data from MySQL' });
    }
} 