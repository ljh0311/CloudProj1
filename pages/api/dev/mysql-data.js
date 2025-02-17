import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    try {
        // Create MySQL connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        try {
            // Fetch users
            const [users] = await connection.execute('SELECT * FROM users');
            
            // Parse JSON fields in users
            users.forEach(user => {
                try {
                    user.cart = JSON.parse(user.cart);
                    user.orders = JSON.parse(user.orders);
                } catch (e) {
                    user.cart = [];
                    user.orders = [];
                }
            });

            // Fetch products
            const [products] = await connection.execute('SELECT * FROM products');

            // Fetch orders
            const [orders] = await connection.execute('SELECT * FROM orders');
            
            // Parse JSON fields in orders
            orders.forEach(order => {
                try {
                    order.items = JSON.parse(order.items);
                } catch (e) {
                    order.items = [];
                }
            });

            res.status(200).json({
                users,
                products,
                orders
            });
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('Error fetching MySQL data:', error);
        res.status(500).json({ message: 'Error fetching MySQL data' });
    }
} 