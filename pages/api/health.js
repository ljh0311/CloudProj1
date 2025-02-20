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

        // Try to connect and check database
        const connection = await pool.getConnection();
        
        // Basic database check
        const [result] = await connection.query('SELECT 1 as value');
        
        // Release the connection
        connection.release();
        await pool.end();

        healthCheck.status = 'healthy';
        healthCheck.database = {
            connected: true,
            check: result[0].value === 1
        };

        res.status(200).json(healthCheck);
    } catch (error) {
        console.error('Health check failed:', error);
        
        healthCheck.status = 'error';
        healthCheck.database = {
            connected: false,
            error: error.message,
            code: error.code,
            solution: error.code === 'ECONNREFUSED' ? 
                'Check if database is running and accessible' :
                'Check database connection settings'
        };
        
        // Still return 200 for health checks, but with error status
        res.status(200).json(healthCheck);
    }
} 