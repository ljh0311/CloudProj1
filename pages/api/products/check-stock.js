import { pool } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid items data' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Check stock for each item
        for (const item of items) {
            const { product_id, size, quantity } = item;
            
            if (!product_id || !size || !quantity) {
                throw new Error('Missing required item data: product_id, size, or quantity');
            }

            // Validate size format
            const validSizes = ['S', 'M', 'L'];
            if (!validSizes.includes(size.toUpperCase())) {
                throw new Error(`Invalid size: ${size}. Must be one of: S, M, L`);
            }

            // Get current stock for the product and size
            const [rows] = await connection.query(
                `SELECT 
                    id,
                    CASE 
                        WHEN ? = 'S' THEN stock_s
                        WHEN ? = 'M' THEN stock_m
                        WHEN ? = 'L' THEN stock_l
                    END as available_stock
                FROM products 
                WHERE id = ?`,
                [size.toUpperCase(), size.toUpperCase(), size.toUpperCase(), product_id]
            );

            if (rows.length === 0) {
                throw new Error(`Product not found: ${product_id}`);
            }

            const product = rows[0];
            if (product.available_stock === null) {
                throw new Error(`Invalid size ${size} for product ${product_id}`);
            }

            if (product.available_stock < quantity) {
                throw new Error(`Insufficient stock for product ${product_id} size ${size}. Available: ${product.available_stock}, Requested: ${quantity}`);
            }

            console.log(`Stock check passed for product ${product_id} size ${size}`);
        }

        return res.status(200).json({
            success: true,
            message: 'All items are available in stock'
        });

    } catch (error) {
        console.error('Stock check error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
} 