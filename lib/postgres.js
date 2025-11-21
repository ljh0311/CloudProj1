import pkg from 'pg';
const { Pool } = pkg;

// Debug environment variables
const envDebug = {
    DB_HOST: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    DB_USER: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'kappy_db',
    DB_PORT: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    NODE_ENV: process.env.NODE_ENV
};

console.log('Environment Variables Debug:', envDebug);

// PostgreSQL Connection Pool Configuration
const config = {
    host: envDebug.DB_HOST,
    user: envDebug.DB_USER,
    password: envDebug.DB_PASSWORD,
    database: envDebug.DB_NAME,
    port: parseInt(envDebug.DB_PORT),
    max: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('PostgreSQL Config:', {
    host: config.host,
    user: config.user,
    database: config.database,
    port: config.port,
    max: config.max,
    ssl: config.ssl
});

// Create connection pool
let pool;

try {
    if (!config.host || !config.user || !config.database) {
        throw new Error('Missing required database configuration');
    }
    
    pool = new Pool(config);
    console.log('PostgreSQL pool created successfully');
} catch (error) {
    console.error('Error creating PostgreSQL pool:', error);
    // Don't throw error immediately, let the application start
    // The connection will be tested when needed
}

// Enhanced error handling for pool events
if (pool) {
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', (client) => {
        console.log('New client connected to PostgreSQL');
    });

    pool.on('remove', (client) => {
        console.log('Client removed from PostgreSQL pool');
    });
}

// Utility function to execute PostgreSQL queries with error handling and retries
export async function executeQuery(query, params = [], retries = 3) {
    // Check if pool exists
    if (!pool) {
        return {
            success: false,
            error: 'Database connection pool not initialized',
            details: {
                code: 'POOL_NOT_INITIALIZED',
                suggestion: 'Check database configuration and ensure PostgreSQL is running'
            }
        };
    }

    let lastError;
    let client;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            client = await pool.connect();
            const result = await client.query(query, params);
            return { success: true, data: result.rows, rowCount: result.rowCount };
        } catch (error) {
            lastError = error;
            console.error(`PostgreSQL Error (attempt ${attempt}/${retries}):`, {
                message: error.message,
                code: error.code,
                detail: error.detail,
                query: query.substring(0, 100) + '...' // Log only first 100 chars for security
            });
            
            // Handle specific PostgreSQL error codes
            switch (error.code) {
                case 'ECONNREFUSED':
                    console.error('Connection refused - PostgreSQL server may not be running');
                    break;
                case 'ENOTFOUND':
                    console.error('Host not found - Check DB_HOST configuration');
                    break;
                case '28P01':
                    console.error('Authentication failed - Check DB_USER and DB_PASSWORD');
                    break;
                case '3D000':
                    console.error('Database does not exist - Check DB_NAME configuration');
                    break;
                case '42501':
                    console.error('Insufficient privileges - Check user permissions');
                    break;
                default:
                    console.error('Unknown database error:', error.code);
            }
            
            // Check if error is due to connection issues
            if (error.code === 'ECONNREFUSED' || 
                error.code === 'ENOTFOUND' || 
                error.code === '28P01' ||
                error.code === '3D000') {
                console.log('Connection error detected, attempting to reconnect...');
                try {
                    pool = new Pool(config);
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
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    
    return { 
        success: false, 
        error: lastError.message,
        details: {
            code: lastError.code,
            detail: lastError.detail,
            suggestion: getErrorSuggestion(lastError.code)
        }
    };
}

// Helper function to provide user-friendly error suggestions
function getErrorSuggestion(errorCode) {
    switch (errorCode) {
        case 'ECONNREFUSED':
            return 'Ensure PostgreSQL server is running and accessible';
        case 'ENOTFOUND':
            return 'Check your DB_HOST configuration in environment variables';
        case '28P01':
            return 'Verify your DB_USER and DB_PASSWORD in environment variables';
        case '3D000':
            return 'Database does not exist. Run "npm run init-db" to create it';
        case '42501':
            return 'User lacks necessary permissions. Grant required privileges';
        case 'POOL_NOT_INITIALIZED':
            return 'Database configuration is missing. Check your .env file';
        default:
            return 'Check your database configuration and ensure PostgreSQL is properly set up';
    }
}

// Test database connection
export async function testConnection() {
    if (!pool) {
        return {
            success: false,
            error: 'Database connection pool not initialized',
            details: {
                code: 'POOL_NOT_INITIALIZED',
                suggestion: 'Check database configuration and ensure PostgreSQL is running'
            }
        };
    }

    try {
        const result = await pool.query('SELECT 1 as test');
        return { 
            success: true, 
            message: 'Database connection successful',
            config: {
                host: config.host,
                user: config.user,
                database: config.database,
                port: config.port,
                max: config.max
            }
        };
    } catch (error) {
        console.error('Database connection test failed:', error);
        return { 
            success: false, 
            error: error.message,
            details: {
                code: error.code,
                detail: error.detail,
                suggestion: getErrorSuggestion(error.code)
            }
        };
    }
}

// Debug information about the database connection
export async function getDebugInfo() {
    if (!pool) {
        return {
            connected: false,
            error: 'Database connection pool not initialized',
            host: config.host,
            user: config.user,
            database: config.database,
            port: config.port,
            max: config.max,
            ssl: !!config.ssl,
            suggestion: 'Check database configuration and ensure PostgreSQL is running'
        };
    }

    try {
        const result = await pool.query('SELECT 1 as connected');
        return {
            connected: true,
            host: config.host,
            user: config.user,
            database: config.database,
            port: config.port,
            max: config.max,
            ssl: !!config.ssl
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            host: config.host,
            user: config.user,
            database: config.database,
            port: config.port,
            max: config.max,
            ssl: !!config.ssl,
            suggestion: getErrorSuggestion(error.code)
        };
    }
}

export { pool };
