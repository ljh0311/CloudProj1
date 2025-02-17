import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    try {
        // Read JSON files
        const usersData = JSON.parse(
            await fs.readFile(path.join(process.cwd(), 'data', 'users.json'), 'utf8')
        );
        const productsData = JSON.parse(
            await fs.readFile(path.join(process.cwd(), 'data', 'products.json'), 'utf8')
        );
        const ordersData = JSON.parse(
            await fs.readFile(path.join(process.cwd(), 'data', 'orders.json'), 'utf8')
        );

        res.status(200).json({
            users: usersData.users,
            products: productsData.products,
            orders: ordersData.orders
        });
    } catch (error) {
        console.error('Error fetching JSON data:', error);
        res.status(500).json({ message: 'Error fetching JSON data' });
    }
} 