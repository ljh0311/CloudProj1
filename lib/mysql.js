import mysql from 'mysql2/promise';

// Debug environment variables
console.log('Environment Variables Debug:', {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    NODE_ENV: process.env.NODE_ENV
});

// MySQL Connection Pool Configuration
const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

console.log('MySQL Config:', {
    host: config.host,
    user: config.user,
    database: config.database,
    ssl: config.ssl
});

// Create connection pool
let pool;

try {
    pool = mysql.createPool(config);
    console.log('MySQL pool created');
} catch (error) {
    console.error('Error creating MySQL pool:', error);
    throw error;
}

// Utility function to execute MySQL queries with error handling and retries
export async function executeQuery(query, params = [], retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const [rows] = await pool.execute(query, params);
            return { success: true, data: rows };
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

// Test database connection
export async function testConnection() {
    try {
        const [rows] = await pool.execute('SELECT 1');
        return { success: true, message: 'Database connection successful' };
    } catch (error) {
        console.error('Database connection test failed:', error);
        return { success: false, error: error.message };
    }
}

// Debug information about the database connection
export async function getDebugInfo() {
    try {
        const [rows] = await pool.execute('SELECT 1 as connected');
        return {
            connected: true,
            config: {
                host: config.host,
                user: config.user,
                database: config.database
            }
        };
    } catch (error) {
        console.error('Debug Info Error:', error);
        return {
            error: error.message,
            connected: false,
            config: {
                host: config.host,
                user: config.user,
                database: config.database
            }
        };
    }
}

export { pool }; 