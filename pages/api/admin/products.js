import { withAdminAuth } from '../middleware/adminAuth';
import { addProduct, updateProduct, deleteProduct } from '../../../lib/db-service';

async function handler(req, res) {
    const { method } = req;

    try {
        switch (method) {
            case 'POST':
                // Add new product
                const addResult = await addProduct(req.body);
                if (!addResult.success) {
                    return res.status(400).json(addResult);
                }
                return res.status(201).json(addResult);

            case 'PUT':
                // Update existing product
                const updateResult = await updateProduct(req.body);
                if (!updateResult.success) {
                    return res.status(400).json(updateResult);
                }
                return res.status(200).json(updateResult);

            case 'DELETE':
                // Delete product
                const { productId } = req.query;
                const deleteResult = await deleteProduct(productId);
                if (!deleteResult.success) {
                    return res.status(400).json(deleteResult);
                }
                return res.status(200).json(deleteResult);

            default:
                res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
                return res.status(405).json({ 
                    success: false, 
                    error: `Method ${method} Not Allowed` 
                });
        }
    } catch (error) {
        console.error('Product management error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}

export default withAdminAuth(handler); 