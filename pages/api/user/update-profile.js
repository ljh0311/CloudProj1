import { getSession } from 'next-auth/react';
import { readJsonFile, writeJsonFile } from '../../../utils/jsonOperations';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Read current users data
        const { users } = await readJsonFile('users.json');

        // Find and update user
        const userIndex = users.findIndex(u => u.id === session.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is already taken by another user
        const emailExists = users.some(u => u.email === email && u.id !== session.user.id);
        if (emailExists) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            name,
            email,
            updatedAt: new Date().toISOString()
        };

        // Write updated data back to file
        await writeJsonFile('users.json', { users, lastId: users.length });

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: users[userIndex].id,
                name: users[userIndex].name,
                email: users[userIndex].email,
                role: users[userIndex].role
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
} 