import { getProducts, createProduct, updateProduct, deleteProduct } from '../../lib/mysql';

export default async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            try {
                const products = await getProducts();
                res.status(200).json({ products });
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).json({ error: 'Failed to fetch products' });
            }
            break;

        case 'POST':
            try {
                const productId = await createProduct(req.body);
                const product = { id: productId, ...req.body };
                res.status(201).json(product);
            } catch (error) {
                console.error('Error creating product:', error);
                res.status(500).json({ error: 'Failed to create product' });
            }
            break;

        case 'PUT':
            try {
                const { id, ...data } = req.body;
                await updateProduct(id, data);
                res.status(200).json({ message: 'Product updated successfully' });
            } catch (error) {
                console.error('Error updating product:', error);
                res.status(500).json({ error: 'Failed to update product' });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                await deleteProduct(id);
                res.status(200).json({ message: 'Product deleted successfully' });
            } catch (error) {
                console.error('Error deleting product:', error);
                res.status(500).json({ error: 'Failed to delete product' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 