import mysql from 'mysql2/promise';

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'kappy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Debug information about the database connection
export const getDebugInfo = async () => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT DATABASE() as db_name');
        const debugInfo = {
            database: rows[0].db_name,
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            connected: true,
            connectionLimit: pool.config.connectionLimit,
            queueLimit: pool.config.queueLimit
        };
        connection.release();
        return debugInfo;
    } catch (error) {
        return {
            error: error.message,
            connected: false,
            config: {
                host: process.env.MYSQL_HOST || 'localhost',
                user: process.env.MYSQL_USER || 'root',
                database: process.env.MYSQL_DATABASE || 'kappy_db'
            }
        };
    }
};

// Utility function to execute MySQL queries with error handling
export const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await pool.execute(query, params);
        return { success: true, data: rows };
    } catch (error) {
        console.error('MySQL Error:', error);
        return { 
            success: false, 
            error: error.message,
            query: query.replace(/\s+/g, ' ').trim() // Sanitized query for debugging
        };
    }
};

// Function to get JSON data as fallback (moved to API route)
export const getJSONData = async (type) => {
    try {
        const response = await fetch(`/api/dev/json/${type}`);
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('JSON Fallback Error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    pool,
    executeQuery,
    getJSONData,
    getDebugInfo
}; 