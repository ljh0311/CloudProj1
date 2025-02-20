const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Checking database connection...');
        const [rows] = await connection.execute('SELECT id, email, role FROM users WHERE email = ?', ['test@example.com']);
        
        if (rows.length > 0) {
            console.log('Test user found:', rows[0]);
        } else {
            console.log('Test user not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkUser().catch(console.error); 