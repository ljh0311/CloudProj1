import { getProducts, getUsers } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { type } = req.query;

        if (type === 'products') {
            const result = await getProducts();
            if (!result.success) {
                throw new Error(result.error);
            }
            return res.status(200).json({ products: result.data });
        }

        if (type === 'users') {
            const result = await getUsers();
            if (!result.success) {
                throw new Error(result.error);
            }
            return res.status(200).json({ users: result.data });
        }

        return res.status(400).json({ message: 'Invalid data type requested' });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
} 