import { getSession } from 'next-auth/react';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default async function handler(req, res) {
    const session = await getSession({ req });

    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const [products] = await pool.execute('SELECT * FROM products');
                res.status(200).json(products);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).json({ error: 'Failed to fetch products' });
            }
            break;

        case 'POST':
            try {
                const {
                    name,
                    price,
                    category,
                    image,
                    material,
                    description,
                    size_s_stock,
                    size_m_stock,
                    size_l_stock
                } = req.body;

                const [result] = await pool.execute(
                    `INSERT INTO products (
                        name, price, category, image, material, description,
                        size_s_stock, size_m_stock, size_l_stock
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        name,
                        price,
                        category,
                        image,
                        material,
                        description,
                        size_s_stock,
                        size_m_stock,
                        size_l_stock
                    ]
                );

                const [newProduct] = await pool.execute(
                    'SELECT * FROM products WHERE id = ?',
                    [result.insertId]
                );

                res.status(201).json(newProduct[0]);
            } catch (error) {
                console.error('Error creating product:', error);
                res.status(500).json({ error: 'Failed to create product' });
            }
            break;

        case 'PUT':
            try {
                const { id } = req.query;
                const updates = req.body;

                const [result] = await pool.execute(
                    `UPDATE products 
                     SET name = ?, price = ?, category = ?, image = ?,
                         material = ?, description = ?,
                         size_s_stock = ?, size_m_stock = ?, size_l_stock = ?
                     WHERE id = ?`,
                    [
                        updates.name,
                        updates.price,
                        updates.category,
                        updates.image,
                        updates.material,
                        updates.description,
                        updates.size_s_stock,
                        updates.size_m_stock,
                        updates.size_l_stock,
                        id
                    ]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                const [updatedProduct] = await pool.execute(
                    'SELECT * FROM products WHERE id = ?',
                    [id]
                );

                res.status(200).json(updatedProduct[0]);
            } catch (error) {
                console.error('Error updating product:', error);
                res.status(500).json({ error: 'Failed to update product' });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;

                const [result] = await pool.execute(
                    'DELETE FROM products WHERE id = ?',
                    [id]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                res.status(200).json({ message: 'Product deleted successfully' });
            } catch (error) {
                console.error('Error deleting product:', error);
                res.status(500).json({ error: 'Failed to delete product' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
} 