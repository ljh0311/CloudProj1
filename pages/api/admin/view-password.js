import mysql from 'mysql2/promise';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify admin session
        const session = await getSession({ req });
        if (!session || session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { userId } = req.body;

        // Connect to database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Get user's password (assuming you store original passwords in a separate secure table)
        const [rows] = await connection.execute(
            'SELECT original_password FROM user_passwords WHERE user_id = ?',
            [userId]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Password not found' });
        }

        // Log this action for security audit
        console.log(`Admin ${session.user.email} viewed password for user ID ${userId} at ${new Date().toISOString()}`);

        return res.status(200).json({ password: rows[0].original_password });

    } catch (error) {
        console.error('Error retrieving password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
