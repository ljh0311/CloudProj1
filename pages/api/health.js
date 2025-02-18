import db from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const healthCheck = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'healthy'
    };

    try {
        // Check database connection
        await db.pool.query('SELECT 1');
        healthCheck.database = 'connected';
    } catch (error) {
        healthCheck.database = 'disconnected';
        healthCheck.status = 'unhealthy';
    }

    const status = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(status).json(healthCheck);
} 