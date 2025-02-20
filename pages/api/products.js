import { getProducts, getProductById } from '../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (id) {
            // Get specific product
            const result = await getProductById(id);
            if (!result.success) {
                throw new Error(result.error);
            }
            return res.status(200).json(result.data);
        }

        // Get all products
        const result = await getProducts();
        if (!result.success) {
            throw new Error(result.error);
        }
        return res.status(200).json(result.data);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ 
            message: 'Error fetching products',
            error: error.message
        });
    }
} 