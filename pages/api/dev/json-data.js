import db, { readJsonFile } from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const [usersData, productsData, ordersData] = await Promise.all([
            readJsonFile('users.json'),
            readJsonFile('products.json'),
            readJsonFile('orders.json')
        ]);

        res.status(200).json({
            users: usersData?.users || [],
            products: productsData?.products || [],
            orders: ordersData?.orders || []
        });
    } catch (error) {
        console.error('Error fetching JSON data:', error);
        res.status(500).json({ message: 'Error fetching data from JSON files' });
    }
} 