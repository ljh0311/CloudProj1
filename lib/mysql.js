import mysql from 'mysql2/promise';

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'kappy_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection pool and retry if needed
async function initPool(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await pool.getConnection();
            console.log('Database connection pool initialized successfully');
            connection.release();
            return true;
        } catch (error) {
            console.error(`Failed to initialize pool (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return false;
}

// Initialize the pool
initPool().catch(error => {
    console.error('Failed to initialize database pool after all retries:', error);
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
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.execute(query, params);
                return { success: true, data: rows };
            } finally {
                connection.release();
            }
        } catch (error) {
            lastError = error;
            console.error(`MySQL Error (attempt ${attempt}/${retries}):`, error);
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
        }
    }
    
    return { 
        success: false, 
        error: lastError.message
    };
}

export { pool }; 