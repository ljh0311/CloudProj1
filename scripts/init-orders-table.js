import { executeQuery } from '../lib/mysql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initOrdersTable() {
    console.log('Starting orders table initialization...');
    
    try {
        // Drop existing orders table if it exists
        console.log('Dropping existing orders table...');
        await executeQuery('DROP TABLE IF EXISTS orders');

        // Create orders table with updated schema
        console.log('Creating orders table...');
        const createTableResult = await executeQuery(`
            CREATE TABLE orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                orderNumber VARCHAR(50) UNIQUE NOT NULL,
                items JSON NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                tax DECIMAL(10,2) NOT NULL,
                shipping DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                shippingAddress JSON NOT NULL,
                billingAddress JSON NOT NULL,
                paymentMethod JSON NOT NULL,
                notes TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id),
                INDEX idx_user (userId),
                INDEX idx_status (status),
                INDEX idx_orderNumber (orderNumber)
            )
        `);

        if (!createTableResult.success) {
            throw new Error(`Failed to create orders table: ${createTableResult.error}`);
        }

        // Create triggers for stock management
        console.log('Creating triggers...');
        
        // Trigger to update product stock on order creation
        await executeQuery(`
            CREATE TRIGGER after_order_create 
            AFTER INSERT ON orders
            FOR EACH ROW
            BEGIN
                DECLARE items_data JSON;
                SET items_data = NEW.items;
                
                UPDATE products p
                INNER JOIN JSON_TABLE(
                    items_data,
                    '$[*]' COLUMNS(
                        productId INT PATH '$.productId',
                        size VARCHAR(10) PATH '$.size',
                        quantity INT PATH '$.quantity'
                    )
                ) AS i ON p.id = i.productId
                SET 
                    p.size_s_stock = CASE WHEN UPPER(i.size) = 'S' THEN p.size_s_stock - i.quantity ELSE p.size_s_stock END,
                    p.size_m_stock = CASE WHEN UPPER(i.size) = 'M' THEN p.size_m_stock - i.quantity ELSE p.size_m_stock END,
                    p.size_l_stock = CASE WHEN UPPER(i.size) = 'L' THEN p.size_l_stock - i.quantity ELSE p.size_l_stock END,
                    p.totalSales = p.totalSales + i.quantity;
            END;
        `);

        // Trigger to update product stock on order cancellation
        await executeQuery(`
            CREATE TRIGGER after_order_cancel
            AFTER UPDATE ON orders
            FOR EACH ROW
            BEGIN
                IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
                    DECLARE items_data JSON;
                    SET items_data = NEW.items;
                    
                    UPDATE products p
                    INNER JOIN JSON_TABLE(
                        items_data,
                        '$[*]' COLUMNS(
                            productId INT PATH '$.productId',
                            size VARCHAR(10) PATH '$.size',
                            quantity INT PATH '$.quantity'
                        )
                    ) AS i ON p.id = i.productId
                    SET 
                        p.size_s_stock = CASE WHEN UPPER(i.size) = 'S' THEN p.size_s_stock + i.quantity ELSE p.size_s_stock END,
                        p.size_m_stock = CASE WHEN UPPER(i.size) = 'M' THEN p.size_m_stock + i.quantity ELSE p.size_m_stock END,
                        p.size_l_stock = CASE WHEN UPPER(i.size) = 'L' THEN p.size_l_stock + i.quantity ELSE p.size_l_stock END,
                        p.totalSales = p.totalSales - i.quantity;
                END IF;
            END;
        `);

        console.log('Orders table and triggers initialized successfully');
    } catch (error) {
        console.error('Error initializing orders table:', error);
        process.exit(1);
    }
}

// Run the initialization
initOrdersTable()
    .then(() => {
        console.log('Orders table setup completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to initialize orders table:', error);
        process.exit(1);
    }); 