import { pool } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                available: false,
                message: 'Invalid items data'
            });
        }

        // Check stock for each item
        const connection = await pool.getConnection();
        try {
            for (const item of items) {
                const [stockResult] = await connection.execute(
                    `SELECT size_${item.size.toLowerCase()}_stock as stock
                     FROM products 
                     WHERE id = ?`,
                    [item.id]
                );

                if (stockResult.length === 0) {
                    return res.status(404).json({
                        available: false,
                        message: `Product ${item.id} not found`
                    });
                }

                const currentStock = stockResult[0].stock;
                if (currentStock < item.quantity) {
                    return res.status(200).json({
                        available: false,
                        message: `Insufficient stock for product ${item.id} size ${item.size}`
                    });
                }
            }

            // If we get here, all items are available
            return res.status(200).json({
                available: true,
                message: 'All items are available'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Stock check error:', error);
        return res.status(500).json({
            available: false,
            message: error.message
        });
    }
} 