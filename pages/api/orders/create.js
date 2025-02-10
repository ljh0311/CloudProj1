import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { readJsonFile, writeJsonFile } from '../../../utils/jsonOperations';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get session using getServerSession instead of getSession
        const session = await getServerSession(req, res, authOptions);
        
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { items, totalAmount, paymentStatus } = req.body;

        if (!items || !totalAmount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Read current orders
        const ordersData = await readJsonFile('orders.json');
        const { orders = [], lastId = 0 } = ordersData;

        // Create new order
        const newOrder = {
            id: lastId + 1,
            userId: session.user.id,
            items: items.map(item => ({
                productId: item.product_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                image: item.image
            })),
            totalAmount,
            status: 'processing',
            paymentStatus: paymentStatus || 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add order to orders array
        orders.push(newOrder);

        // Update orders.json
        await writeJsonFile('orders.json', {
            orders,
            lastId: newOrder.id
        });

        // Update product stock levels
        const productsData = await readJsonFile('products.json');
        const updatedProducts = productsData.products.map(product => {
            const orderedItem = items.find(item => item.product_id === product.id);
            if (orderedItem) {
                const stockField = `size_${orderedItem.size.toLowerCase()}_stock`;
                return {
                    ...product,
                    [stockField]: Math.max(0, product[stockField] - orderedItem.quantity)
                };
            }
            return product;
        });

        // Save updated product data
        await writeJsonFile('products.json', {
            products: updatedProducts,
            lastId: productsData.lastId
        });

        // Clear user's cart
        const usersData = await readJsonFile('users.json');
        const updatedUsers = usersData.users.map(user => {
            if (user.id === session.user.id) {
                return {
                    ...user,
                    cart: []
                };
            }
            return user;
        });

        await writeJsonFile('users.json', {
            users: updatedUsers,
            lastId: usersData.lastId
        });

        res.status(201).json({
            message: 'Order created successfully',
            orderId: newOrder.id
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
} 