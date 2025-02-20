import { getProducts, getProductById, createProduct } from '../../lib/db-service';

export default async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            try {
                const productId = req.query.id;
                if (productId) {
                    const result = await getProductById(productId);
                    if (!result.success) {
                        return res.status(404).json({ error: result.error });
                    }
                    return res.status(200).json(result.data);
                }

                const result = await getProducts();
                if (!result.success) {
                    return res.status(500).json({ error: result.error });
                }
                return res.status(200).json({ products: result.data });
            } catch (error) {
                console.error('Products API Error:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
            break;

        case 'POST':
            try {
                const result = await createProduct(req.body);
                if (!result.success) {
                    return res.status(400).json({ error: result.error });
                }
                return res.status(201).json(result.data);
            } catch (error) {
                console.error('Create Product Error:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 