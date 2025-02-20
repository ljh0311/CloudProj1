import mysql from 'mysql2/promise';

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kappy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Debug information about the database connection
export async function getDebugInfo() {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT DATABASE() as db_name');
        const debugInfo = {
            database: rows[0].db_name,
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            connected: true,
            connectionLimit: pool.config.connectionLimit,
            queueLimit: pool.config.queueLimit
        };
        connection.release();
        return debugInfo;
    } catch (error) {
        console.error('Database connection error:', error);
        return {
            error: error.message,
            connected: false,
            config: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                database: process.env.DB_NAME || 'kappy_db'
            }
        };
    }
}

// Utility function to execute MySQL queries with error handling
export async function executeQuery(query, params = []) {
    try {
        console.log('Executing query:', query.replace(/\s+/g, ' ').trim());
        console.log('Query parameters:', params);
        
        const [rows] = await pool.execute(query, params);
        console.log('Query successful, rows affected:', rows.length);
        return { success: true, data: rows };
    } catch (error) {
        console.error('MySQL Error:', error);
        console.error('Failed query:', query.replace(/\s+/g, ' ').trim());
        console.error('Query parameters:', params);
        return { 
            success: false, 
            error: error.message,
            query: query.replace(/\s+/g, ' ').trim()
        };
    }
}

// Function to get JSON data as fallback (moved to API route)
export async function getJSONData(type) {
    try {
        const response = await fetch(`/api/dev/json/${type}`);
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('JSON Fallback Error:', error);
        return { success: false, error: error.message };
    }
}

export { pool }; 