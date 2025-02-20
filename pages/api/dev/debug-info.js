import { getDebugInfo } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const debugInfo = await getDebugInfo();
        res.status(200).json(debugInfo);
    } catch (error) {
        console.error('Error fetching debug info:', error);
        res.status(500).json({ 
            error: 'Failed to fetch debug info',
            details: error.message 
        });
    }
} 