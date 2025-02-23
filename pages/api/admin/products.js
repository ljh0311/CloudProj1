import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { pool } from '../../../lib/mysql';

export default async function handler(req, res) {
    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session || session.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        switch (req.method) {
            case 'GET':
                // Get all products
                const [products] = await pool.execute(
                    `SELECT id, name, price, category, image, material, description,
                            size_s_stock, size_m_stock, size_l_stock, created_at, updated_at
                     FROM products
                     ORDER BY created_at DESC`
                );
                return res.status(200).json({ success: true, data: products });

            case 'POST':
                // Create new product
                const newProduct = req.body;
                const [result] = await pool.execute(
                    `INSERT INTO products (
                        name, price, category, image, material, description,
                        size_s_stock, size_m_stock, size_l_stock
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newProduct.name,
                        newProduct.price,
                        newProduct.category,
                        newProduct.image,
                        newProduct.material,
                        newProduct.description,
                        newProduct.size_s_stock,
                        newProduct.size_m_stock,
                        newProduct.size_l_stock
                    ]
                );
                
                const [createdProduct] = await pool.execute(
                    'SELECT * FROM products WHERE id = ?',
                    [result.insertId]
                );
                
                return res.status(201).json({ 
                    success: true, 
                    data: createdProduct[0]
                });

            case 'PUT':
                // Update product
                const updateProduct = req.body;
                await pool.execute(
                    `UPDATE products 
                     SET name = ?, price = ?, category = ?, image = ?,
                         material = ?, description = ?,
                         size_s_stock = ?, size_m_stock = ?, size_l_stock = ?,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [
                        updateProduct.name,
                        updateProduct.price,
                        updateProduct.category,
                        updateProduct.image,
                        updateProduct.material,
                        updateProduct.description,
                        updateProduct.size_s_stock,
                        updateProduct.size_m_stock,
                        updateProduct.size_l_stock,
                        updateProduct.id
                    ]
                );

                const [updatedProduct] = await pool.execute(
                    'SELECT * FROM products WHERE id = ?',
                    [updateProduct.id]
                );

                return res.status(200).json({
                    success: true,
                    data: updatedProduct[0]
                });

            case 'DELETE':
                // Delete product
                const { id } = req.query;
                await pool.execute('DELETE FROM products WHERE id = ?', [id]);
                return res.status(200).json({ success: true });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ 
                    success: false, 
                    error: `Method ${req.method} Not Allowed` 
                });
        }
    } catch (error) {
        console.error('Product management error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message
        });
    }
} 