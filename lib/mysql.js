import mysql from 'mysql2/promise';

// Debug environment variables
const envDebug = {
    DB_HOST: process.env.DB_HOST || process.env.MYSQL_HOST,
    DB_USER: process.env.DB_USER || process.env.MYSQL_USER,
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
    DB_NAME: process.env.DB_NAME || process.env.MYSQL_DATABASE,
    NODE_ENV: process.env.NODE_ENV
};

console.log('Environment Variables Debug:', envDebug);

// MySQL Connection Pool Configuration
const config = {
    host: envDebug.DB_HOST,
    user: envDebug.DB_USER,
    password: envDebug.DB_PASSWORD,
    database: envDebug.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
    ssl: {
        rejectUnauthorized: false // Required for AWS RDS
    }
};

console.log('MySQL Config:', {
    host: config.host,
    user: config.user,
    database: config.database,
    connectionLimit: config.connectionLimit,
    queueLimit: config.queueLimit,
    ssl: config.ssl
});

// Create connection pool
let pool;

try {
    if (!config.host || !config.user || !config.password || !config.database) {
        throw new Error('Missing required database configuration');
    }
    
    pool = mysql.createPool(config);
    console.log('MySQL pool created successfully');
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
            console.error(`MySQL Error (attempt ${attempt}/${retries}):`, {
                message: error.message,
                code: error.code,
                sqlState: error.sqlState,
                query: query
            });
            
            // Check if error is due to connection issues
            if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
                error.code === 'ECONNREFUSED' || 
                error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('Connection error detected, attempting to reconnect...');
                try {
                    pool = mysql.createPool(config);
                } catch (poolError) {
                    console.error('Failed to recreate connection pool:', poolError);
                }
            }
            
            if (attempt < retries) {
                const delay = 1000 * attempt;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }
    
    return { 
        success: false, 
        error: lastError.message,
        details: {
            code: lastError.code,
            sqlState: lastError.sqlState
        }
    };
}

// Test database connection
export async function testConnection() {
    try {
        const [rows] = await pool.execute('SELECT 1');
        return { 
            success: true, 
            message: 'Database connection successful',
            config: {
                host: config.host,
                user: config.user,
                database: config.database,
                connectionLimit: config.connectionLimit
            }
        };
    } catch (error) {
        console.error('Database connection test failed:', error);
        return { 
            success: false, 
            error: error.message,
            details: {
                code: error.code,
                sqlState: error.sqlState
            }
        };
    }
}

// Debug information about the database connection
export async function getDebugInfo() {
    try {
        const [rows] = await pool.execute('SELECT 1 as connected');
        return {
            connected: true,
            host: config.host,
            user: config.user,
            database: config.database,
            connectionLimit: config.connectionLimit,
            queueLimit: config.queueLimit,
            ssl: !!config.ssl
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            host: config.host,
            user: config.user,
            database: config.database,
            connectionLimit: config.connectionLimit,
            queueLimit: config.queueLimit,
            ssl: !!config.ssl
        };
    }
}

export { pool }; 