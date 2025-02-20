import mysql from 'mysql2/promise';

// Debug environment variables
console.log('Environment Variables Debug:', {
    DB_HOST: process.env.DB_HOST,
    MYSQL_HOST: process.env.MYSQL_HOST,
    DB_USER: process.env.DB_USER,
    MYSQL_USER: process.env.MYSQL_USER,
    DB_NAME: process.env.DB_NAME,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    NODE_ENV: process.env.NODE_ENV
});

// MySQL Connection Pool Configuration
const config = {
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        rejectUnauthorized: false
    }
};

console.log('MySQL Config:', {
    host: config.host,
    user: config.user,
    database: config.database,
    connectionLimit: config.connectionLimit,
    ssl: config.ssl
});

let pool;
try {
    pool = mysql.createPool(config);
    console.log('Pool created successfully');
} catch (error) {
    console.error('Error creating pool:', error);
    throw error;
}

// Test the connection pool and retry if needed
async function initPool(retries = 3) {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to database');
        connection.release();
        return true;
    } catch (error) {
        console.error('Failed to initialize pool:', error);
        if (retries > 0) {
            console.log(`Retrying... ${retries} attempts remaining`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return initPool(retries - 1);
        }
        throw error;
    }
}

// Initialize the pool
initPool().catch(error => {
    console.error('Failed to initialize database pool after all retries:', error);
});

// Debug information about the database connection
export async function getDebugInfo() {
    try {
        if (!pool) {
            throw new Error('Pool was not initialized');
        }
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT 1 as connected');
            return {
                connected: true,
                config: {
                    host: config.host,
                    user: config.user,
                    database: config.database,
                    connectionLimit: config.connectionLimit
                }
            };
        } finally {
            connection.release();
        }
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

// Utility function to execute MySQL queries with error handling and retries
export async function executeQuery(query, params = [], retries = 3) {
    if (!pool) {
        return { 
            success: false, 
            error: 'Database pool not initialized' 
        };
    }

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