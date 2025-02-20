import { executeQuery } from '../lib/mysql';

async function initOrdersTable() {
    try {
        // Create orders table if it doesn't exist
        const createTableResult = await executeQuery(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                orderNumber VARCHAR(50) NOT NULL UNIQUE,
                items JSON NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                tax DECIMAL(10,2) NOT NULL,
                shipping DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status ENUM('processing', 'completed', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
                shippingAddress JSON,
                billingAddress JSON,
                paymentMethod JSON,
                notes TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);

        if (!createTableResult.success) {
            throw new Error(`Failed to create orders table: ${createTableResult.error}`);
        }

        console.log('Orders table initialized successfully');
    } catch (error) {
        console.error('Error initializing orders table:', error);
        process.exit(1);
    }
}

// Run the initialization
initOrdersTable(); 