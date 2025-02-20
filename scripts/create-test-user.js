const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'KappyAdmin',
        database: process.env.DB_NAME || 'kappy_db'
    });

    try {
        // Test user credentials
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: await bcrypt.hash('testpass123', 12),
            role: 'admin'  // Making it admin so we can test admin features too
        };

        // Check if user already exists
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [testUser.email]
        );

        if (existingUser.length > 0) {
            console.log('Test user already exists');
            return;
        }

        // Create the test user
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [testUser.name, testUser.email, testUser.password, testUser.role]
        );

        console.log('Test user created successfully');
        console.log('Email:', testUser.email);
        console.log('Password: testpass123');

    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await connection.end();
    }
}

createTestUser().catch(console.error); 