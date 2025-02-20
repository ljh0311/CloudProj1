import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { type } = req.query;
    const validTypes = ['users', 'products', 'orders'];

    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid data type requested' });
    }

    try {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        const jsonData = await fs.readFile(filePath, 'utf8');
        res.status(200).json(JSON.parse(jsonData));
    } catch (error) {
        console.error(`Error reading ${type}.json:`, error);
        res.status(500).json({ 
            error: `Failed to read ${type} data`,
            details: error.message 
        });
    }
} 