const { readJsonFile } = require('../../../utils/jsonOperations');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { type } = req.query;

        if (!type) {
            return res.status(400).json({ message: 'Missing type parameter' });
        }

        const filename = type === 'products' ? 'products.json' : 'users.json';
        const data = await readJsonFile(filename);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Error fetching data' });
    }
} 