import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { executeQuery } from '../../../lib/mysql';
import { AppError, catchAsync } from '../../../utils/errorHandler';

// Helper function to validate admin role
const validateAdmin = async (req, res) => {
    const session = await getServerSession(req, res, authOptions);
    
    console.log('Validating admin session:', {
        sessionExists: !!session,
        userRole: session?.user?.role
    });

    if (!session?.user?.role === 'admin') {
        throw new AppError('Unauthorized access - Admin role required', 401);
    }
    return session;
};

export default catchAsync(async (req, res) => {
    console.log('Admin orders API called:', {
        method: req.method,
        query: req.query,
        body: req.body
    });

    await validateAdmin(req, res);

    switch (req.method) {
        case 'GET':
            console.log('Fetching all orders with user details');
            const result = await executeQuery(
                `SELECT o.*, u.name as userName, u.email as userEmail
                 FROM orders o
                 LEFT JOIN users u ON o.userId = u.id
                 ORDER BY o.createdAt DESC`
            );

            if (!result.success) {
                console.error('Failed to fetch orders:', result.error);
                throw new AppError('Failed to fetch orders: ' + result.error, 500);
            }

            console.log(`Successfully fetched ${result.data.length} orders`);

            // Parse JSON strings in the orders
            const orders = result.data.map(order => {
                try {
                    return {
                        ...order,
                        items: JSON.parse(order.items || '[]'),
                        shippingAddress: JSON.parse(order.shippingAddress || '{}'),
                        billingAddress: JSON.parse(order.billingAddress || '{}'),
                        paymentMethod: JSON.parse(order.paymentMethod || '{}')
                    };
                } catch (error) {
                    console.error('Error parsing order JSON:', error, { orderId: order.id });
                    return order;
                }
            });

            return res.status(200).json({ success: true, data: orders });

        case 'PUT':
            const { id, status } = req.body;
            
            if (!id || !status) {
                throw new AppError('Order ID and status are required', 400);
            }

            console.log('Updating order status:', { id, status });

            const updateResult = await executeQuery(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, id]
            );

            if (!updateResult.success) {
                console.error('Failed to update order status:', updateResult.error);
                throw new AppError('Failed to update order status: ' + updateResult.error, 500);
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

            console.log('Deleting order:', { orderId });

            const deleteResult = await executeQuery(
                'DELETE FROM orders WHERE id = ?',
                [orderId]
            );

            if (!deleteResult.success) {
                console.error('Failed to delete order:', deleteResult.error);
                throw new AppError('Failed to delete order: ' + deleteResult.error, 500);
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