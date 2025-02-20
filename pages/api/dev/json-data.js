import { getProducts, getUsers, getOrders } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Fetch all data from MySQL
        const [productsResult, usersResult, ordersResult] = await Promise.all([
            getProducts(),
            getUsers(),
            getOrders()
        ]);

        // Check for any errors
        if (!productsResult.success || !usersResult.success || !ordersResult.success) {
            throw new Error('Failed to fetch data');
        }

        // Return all data
        res.status(200).json({
            products: productsResult.data,
            users: usersResult.data,
            orders: ordersResult.data
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ 
            message: 'Error fetching data',
            error: error.message
        });
    }
} 