require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAuthConfig() {
    console.log('\n=== Authentication Configuration Check ===\n');

    // Check environment variables
    console.log('1. Environment Variables:');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set ❌');
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set ✓' : 'Not set ❌');
    console.log('DB_HOST:', process.env.DB_HOST || 'Not set ❌');
    console.log('DB_USER:', process.env.DB_USER || 'Not set ❌');
    console.log('DB_NAME:', process.env.DB_NAME || 'Not set ❌');
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Set ✓' : 'Not set ❌');

    // Check database connection
    console.log('\n2. Database Connection:');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'KappyAdmin',
            database: process.env.DB_NAME || 'kappy_db'
        });

        // Test connection
        await connection.execute('SELECT 1');
        console.log('Database connection successful ✓');

        // Check users table
        const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
        if (tables.length > 0) {
            console.log('Users table exists ✓');
            
            // Check table structure
            const [columns] = await connection.execute('DESCRIBE users');
            console.log('\nUsers table structure:');
            columns.forEach(col => {
                console.log(`- ${col.Field}: ${col.Type}`);
            });

            // Check for test user
            const [users] = await connection.execute(
                'SELECT id, name, email, role FROM users WHERE email = ?',
                ['test@example.com']
            );
            
            if (users.length > 0) {
                console.log('\nTest user exists ✓');
                console.log('User details:', users[0]);
            } else {
                console.log('\nTest user not found ❌');
                console.log('Please run create-test-user.js to create a test user');
            }
        } else {
            console.log('Users table does not exist ❌');
        }

        await connection.end();
    } catch (error) {
        console.error('Database connection failed ❌');
        console.error('Error:', error.message);
    }
}

checkAuthConfig().catch(console.error); 