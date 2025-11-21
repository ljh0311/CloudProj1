import { getDebugInfo } from '../../lib/postgres';

export default async function handler(req, res) {
    try {
        const debugInfo = await getDebugInfo();
        console.log('Database connection test:', debugInfo);
        res.status(200).json(debugInfo);
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({
            error: error.message,
            code: error.code,
            errno: error.errno,
            syscall: error.syscall,
            hostname: error.hostname
        });
    }
} 