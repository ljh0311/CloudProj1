import { getSession } from 'next-auth/react';
import { readJsonFile, writeJsonFile } from '../../../utils/jsonOperations';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
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

        // Read current users data
        const { users } = await readJsonFile('users.json');

        // Find user
        const userIndex = users.findIndex(u => u.id === session.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, users[userIndex].password);
        if (!isValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            password: hashedPassword,
            updatedAt: new Date().toISOString()
        };

        // Write updated data back to file
        await writeJsonFile('users.json', { users, lastId: users.length });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
} 