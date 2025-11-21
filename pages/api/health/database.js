import { checkDatabaseHealth } from '../../../utils/databaseErrorHandler';
import { getDebugInfo } from '../../../lib/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get detailed database health information
        const healthCheck = await checkDatabaseHealth();
        const debugInfo = await getDebugInfo();

        const response = {
            status: healthCheck.healthy ? 'healthy' : 'unhealthy',
            database: {
                ...healthCheck,
                debug: debugInfo
            },
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };

        // Return appropriate status code based on health
        const statusCode = healthCheck.healthy ? 200 : 503;
        
        return res.status(statusCode).json(response);
    } catch (error) {
        console.error('Health check error:', error);
        
        return res.status(500).json({
            status: 'error',
            error: 'Health check failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
