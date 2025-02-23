import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { pool } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session || session.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                error: 'Unauthorized' 
            });
        }

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID is required' 
            });
        }

        // Get user's password (hashed)
        const [user] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (!user || user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // For security reasons, we only show the first and last few characters
        const hashedPassword = user[0].password;
        const maskedPassword = `${hashedPassword.slice(0, 10)}...${hashedPassword.slice(-10)}`;

        return res.status(200).json({ 
            success: true, 
            password: maskedPassword 
        });
    } catch (error) {
        console.error('Error viewing password:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message
        });
    }
}
