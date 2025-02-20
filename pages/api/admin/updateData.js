import { writeJsonFile, readJsonFile } from '../../../utils/jsonOperations';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { type, data } = req.body;

        if (!type || !data) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const filename = type === 'products' ? 'products.json' : 'users.json';
        await writeJsonFile(filename, data);

        res.status(200).json({ message: 'Data updated successfully' });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Error updating data' });
    }
} 