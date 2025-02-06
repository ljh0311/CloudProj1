import { getSession } from 'next-auth/react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../utils/db';
import { isAdmin } from '../../utils/auth';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const session = await getSession({ req });

    // Check if user is authenticated and is an admin for write operations
    if (req.method !== 'GET' && !isAdmin(session)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        switch (req.method) {
            case 'GET':
                const productsPath = path.join(process.cwd(), 'data', 'products.json');
                const fileContents = fs.readFileSync(productsPath, 'utf8');
                const data = JSON.parse(fileContents);
                res.status(200).json(data.products);
                break;

            case 'POST':
                const newProduct = addProduct(req.body);
                return res.status(201).json(newProduct);

            case 'PUT':
                const { id, ...updates } = req.body;
                const updatedProduct = updateProduct(parseInt(id), updates);
                return res.status(200).json(updatedProduct);

            case 'DELETE':
                const { id: deleteId } = req.query;
                await deleteProduct(parseInt(deleteId));
                return res.status(200).json({ message: 'Product deleted successfully' });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Product API Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
} 