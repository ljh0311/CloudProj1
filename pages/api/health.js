import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const healthCheck = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'checking'
    };

    try {
        // Create a test connection
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 1
        });

        // Try to connect and check users table
        const connection = await pool.getConnection();
        
        // Check if users table exists and get count
        const [tables] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM users
        `);

        // Release the connection
        connection.release();
        await pool.end();

        healthCheck.status = 'healthy';
        healthCheck.database = {
            connected: true,
            usersCount: tables[0].count
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        healthCheck.status = 'error';
        healthCheck.database = {
            connected: false,
            error: error.message,
            code: error.code,
            solution: error.code === 'ER_NO_SUCH_TABLE' ? 
                'Users table does not exist. Run this SQL:\n' +
                'CREATE TABLE users (\n' +
                '  id INT AUTO_INCREMENT PRIMARY KEY,\n' +
                '  name VARCHAR(255) NOT NULL,\n' +
                '  email VARCHAR(255) UNIQUE NOT NULL,\n' +
                '  password VARCHAR(255) NOT NULL,\n' +
                '  role VARCHAR(50) DEFAULT "customer",\n' +
                '  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n' +
                '  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n' +
                ');' : 'Check your MySQL connection settings'
        };
        
        res.status(500).json(healthCheck);
    }
} 