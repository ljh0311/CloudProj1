import mysql from 'mysql2/promise';

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kappy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test the connection pool
pool.getConnection()
    .then(connection => {
        console.log('Database connection pool initialized');
        connection.release();
    })
    .catch(error => {
        console.error('Error initializing database connection pool:', error);
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

// Utility function to execute MySQL queries with error handling and retries
export async function executeQuery(query, params = [], retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Executing query (attempt ${attempt}/${retries}):`, query.replace(/\s+/g, ' ').trim());
            console.log('Query parameters:', params);
            
            const [rows] = await pool.execute(query, params);
            console.log('Query successful, rows affected:', rows.length);
            return { success: true, data: rows };
        } catch (error) {
            lastError = error;
            console.error(`MySQL Error (attempt ${attempt}/${retries}):`, error);
            console.error('Failed query:', query.replace(/\s+/g, ' ').trim());
            console.error('Query parameters:', params);
            
            // If it's not the last attempt, wait before retrying
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
        }
    }
    
    return { 
        success: false, 
        error: lastError.message,
        query: query.replace(/\s+/g, ' ').trim()
    };
}

export { pool }; 