import { addProduct, updateProduct, deleteProduct } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { action, data } = req.body;

        let result;
        switch (action) {
            case 'add':
                result = await addProduct(data);
                break;
            case 'update':
                result = await updateProduct(data.id, data);
                break;
            case 'delete':
                result = await deleteProduct(data.id);
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        if (!result.success) {
            throw new Error(result.error);
        }

        return res.status(200).json({ 
            success: true, 
            message: `Product ${action}ed successfully`,
            data: result.data 
        });
    } catch (error) {
        console.error('Error managing product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error managing product', 
            error: error.message 
        });
    }
} 