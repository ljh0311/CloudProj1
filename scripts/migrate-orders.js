const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.production' });

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
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                items JSON NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                tax DECIMAL(10, 2) NOT NULL,
                shipping DECIMAL(10, 2) NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
                shipping_address JSON NOT NULL,
                billing_address JSON NOT NULL,
                payment_method JSON NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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