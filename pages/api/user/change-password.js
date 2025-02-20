import { getSession } from 'next-auth/react';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get user from database
        const result = await executeQuery(
            'SELECT * FROM users WHERE id = ?',
            [session.user.id]
        );

        if (!result.success || !result.data[0]) {
            throw new Error('User not found');
        }

        const user = result.data[0];

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password in database
        const updateResult = await executeQuery(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, session.user.id]
        );

        if (!updateResult.success) {
            throw new Error('Failed to update password');
        }

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            message: 'Failed to change password',
            error: error.message
        });
    }
} 