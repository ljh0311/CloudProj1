const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateOrders() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Drop existing table if it exists
        await connection.execute('DROP TABLE IF EXISTS orders');

        // Create new orders table with improved structure
        await connection.execute(`
            CREATE TABLE orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                orderNumber VARCHAR(50) UNIQUE NOT NULL,
                items JSON NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                tax DECIMAL(10, 2) NOT NULL,
                shipping DECIMAL(10, 2) NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
                shippingAddress JSON NOT NULL,
                billingAddress JSON NOT NULL,
                paymentMethod JSON NOT NULL,
                notes TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Orders table migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrateOrders(); 