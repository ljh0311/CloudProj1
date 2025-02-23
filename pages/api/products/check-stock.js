import { pool } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let connection;
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid items data'
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const stockChecks = [];
        const insufficientItems = [];

        for (const item of items) {
            const { id, size, quantity } = item;
            
            if (!id || !size || !quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Missing required item data'
                });
            }

            const sizeColumn = `size_${size.toLowerCase()}_stock`;
            const [product] = await connection.execute(
                `SELECT name, ${sizeColumn} as stock FROM products WHERE id = ?`,
                [id]
            );

            if (product.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Product ${id} not found`
                });
            }

            const currentStock = product[0].stock;
            if (currentStock < quantity) {
                insufficientItems.push({
                    id,
                    name: product[0].name,
                    size: size.toUpperCase(),
                    requested: quantity,
                    available: currentStock
                });
            }

            stockChecks.push({
                id,
                name: product[0].name,
                size,
                requested: quantity,
                available: currentStock
            });
        }

        await connection.commit();

        if (insufficientItems.length > 0) {
            return res.status(200).json({
                success: false,
                message: 'Some items are out of stock',
                insufficientItems
            });
        }

        return res.status(200).json({
            success: true,
            message: 'All items are available',
            stockChecks
        });

    } catch (error) {
        console.error('Stock check error:', error);
        if (connection) {
            await connection.rollback();
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
} 