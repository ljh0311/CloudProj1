import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

async function verifyDatabaseSetup() {
    console.log('Starting database verification...');
    console.log('Database config:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        ssl: !!dbConfig.ssl
    });

    let connection;
    try {
        // Test connection
        console.log('Testing database connection...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Database connection successful');

        // Check tables
        console.log('\nChecking required tables...');
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('Found tables:', tableNames);

        // Verify users table
        if (tableNames.includes('users')) {
            const [userColumns] = await connection.query('DESCRIBE users');
            console.log('\n✓ Users table exists with columns:');
            userColumns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });

            // Check for admin user
            const [adminUser] = await connection.query(
                "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1"
            );
            if (adminUser.length > 0) {
                console.log('✓ Admin user exists:', adminUser[0].email);
            } else {
                console.log('⚠ Warning: No admin user found');
            }
        } else {
            console.log('⚠ Warning: Users table not found');
        }

        // Verify products table
        if (tableNames.includes('products')) {
            const [productColumns] = await connection.query('DESCRIBE products');
            console.log('\n✓ Products table exists with columns:');
            productColumns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });

            // Check product count
            const [productCount] = await connection.query('SELECT COUNT(*) as count FROM products');
            console.log(`✓ Products table contains ${productCount[0].count} products`);
        } else {
            console.log('⚠ Warning: Products table not found');
        }

        // Verify orders table
        if (tableNames.includes('orders')) {
            const [orderColumns] = await connection.query('DESCRIBE orders');
            console.log('\n✓ Orders table exists with columns:');
            orderColumns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });

            // Check triggers
            const [triggers] = await connection.query('SHOW TRIGGERS');
            console.log('\nOrder-related triggers:');
            triggers.forEach(trigger => {
                if (trigger.Table === 'orders') {
                    console.log(`✓ ${trigger.Trigger}: ${trigger.Timing} ${trigger.Event}`);
                }
            });
        } else {
            console.log('⚠ Warning: Orders table not found');
        }

        // Check foreign key constraints
        console.log('\nChecking foreign key constraints...');
        const [constraints] = await connection.query(`
            SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_NAME IS NOT NULL
            AND TABLE_SCHEMA = ?
        `, [dbConfig.database]);

        if (constraints.length > 0) {
            console.log('✓ Foreign key constraints:');
            constraints.forEach(constraint => {
                console.log(`  - ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            console.log('⚠ Warning: No foreign key constraints found');
        }

        console.log('\nDatabase verification completed successfully!');
    } catch (error) {
        console.error('\n❌ Error during verification:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the verification
verifyDatabaseSetup()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    }); 