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
                // Validate size format
                const size = item.size.toLowerCase();
                if (!['s', 'm', 'l'].includes(size)) {
                    return res.status(400).json({
                        available: false,
                        message: `Invalid size: ${item.size}. Must be S, M, or L`
                    });
                }

                // Use prepared statement to prevent SQL injection
                const [stockResult] = await connection.execute(
                    `SELECT 
                        CASE 
                            WHEN ? = 's' THEN size_s_stock
                            WHEN ? = 'm' THEN size_m_stock
                            WHEN ? = 'l' THEN size_l_stock
                        END as stock,
                        name
                    FROM products 
                    WHERE id = ?`,
                    [size, size, size, item.id]
                );

                if (stockResult.length === 0) {
                    return res.status(404).json({
                        available: false,
                        message: `Product ${item.id} not found`
                    });
                }

                const currentStock = stockResult[0].stock;
                if (currentStock === null) {
                    return res.status(400).json({
                        available: false,
                        message: `Invalid size ${item.size} for product ${item.id}`
                    });
                }

                if (currentStock < item.quantity) {
                    return res.status(200).json({
                        available: false,
                        message: `Insufficient stock for ${stockResult[0].name} (Size ${item.size.toUpperCase()}). Available: ${currentStock}, Requested: ${item.quantity}`
                    });
                }

                console.log(`Stock check passed for product ${item.id} size ${size}: ${currentStock} >= ${item.quantity}`);
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