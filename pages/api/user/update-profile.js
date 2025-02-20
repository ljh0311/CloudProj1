import { getSession } from 'next-auth/react';
import { executeQuery } from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { name, email, shippingAddress, billingAddress } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if email is already taken by another user
        if (email !== session.user.email) {
            const emailCheck = await executeQuery(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, session.user.id]
            );

            if (emailCheck.success && emailCheck.data.length > 0) {
                return res.status(400).json({ message: 'Email is already taken' });
            }
        }

        // Update user profile in database
        const result = await executeQuery(
            `UPDATE users 
             SET name = ?, 
                 email = ?, 
                 shippingAddress = ?, 
                 billingAddress = ?
             WHERE id = ?`,
            [
                name,
                email,
                JSON.stringify(shippingAddress || {}),
                JSON.stringify(billingAddress || {}),
                session.user.id
            ]
        );

        if (!result.success) {
            throw new Error('Failed to update profile');
        }

        // Get updated user data
        const userResult = await executeQuery(
            'SELECT id, name, email, role, shippingAddress, billingAddress FROM users WHERE id = ?',
            [session.user.id]
        );

        if (!userResult.success || !userResult.data[0]) {
            throw new Error('Failed to fetch updated user data');
        }

        const updatedUser = userResult.data[0];

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                ...updatedUser,
                shippingAddress: JSON.parse(updatedUser.shippingAddress || '{}'),
                billingAddress: JSON.parse(updatedUser.billingAddress || '{}')
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            message: 'Failed to update profile',
            error: error.message
        });
    }
} 