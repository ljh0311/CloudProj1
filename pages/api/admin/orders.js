import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { executeQuery } from '../../../lib/mysql';
import { AppError, catchAsync } from '../../../utils/errorHandler';

// Helper function to validate admin role
const validateAdmin = async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.role === 'admin') {
        throw new AppError('Unauthorized access', 401);
    }
    return session;
};

export default catchAsync(async (req, res) => {
    await validateAdmin(req, res);

    switch (req.method) {
        case 'GET':
            const result = await executeQuery(
                `SELECT o.*, u.name as userName, u.email as userEmail
                 FROM orders o
                 LEFT JOIN users u ON o.userId = u.id
                 ORDER BY o.createdAt DESC`
            );

            if (!result.success) {
                throw new AppError('Failed to fetch orders', 500);
            }

            // Parse JSON strings in the orders
            const orders = result.data.map(order => ({
                ...order,
                items: JSON.parse(order.items || '[]'),
                shippingAddress: JSON.parse(order.shippingAddress || '{}'),
                billingAddress: JSON.parse(order.billingAddress || '{}'),
                paymentMethod: JSON.parse(order.paymentMethod || '{}')
            }));

            return res.status(200).json({ success: true, data: orders });

        case 'PUT':
            const { id, status } = req.body;
            
            if (!id || !status) {
                throw new AppError('Order ID and status are required', 400);
            }

            const updateResult = await executeQuery(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, id]
            );

            if (!updateResult.success) {
                throw new AppError('Failed to update order status', 500);
            }

            return res.status(200).json({
                success: true,
                message: 'Order status updated successfully'
            });

        case 'DELETE':
            const orderId = req.query.id;
            
            if (!orderId) {
                throw new AppError('Order ID is required', 400);
            }

            const deleteResult = await executeQuery(
                'DELETE FROM orders WHERE id = ?',
                [orderId]
            );

            if (!deleteResult.success) {
                throw new AppError('Failed to delete order', 500);
            }

            return res.status(200).json({
                success: true,
                message: 'Order deleted successfully'
            });

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            throw new AppError(`Method ${req.method} Not Allowed`, 405);
    }
}); 