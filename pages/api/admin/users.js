import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { pool } from '../../../lib/mysql';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    try {
        const session = await getServerSession(req, res, authOptions);
        
        if (!session || session.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        switch (req.method) {
            case 'GET':
                // Get all users
                const [users] = await pool.execute(
                    `SELECT id, name, email, role, created_at, updated_at
                     FROM users
                     ORDER BY created_at DESC`
                );
                return res.status(200).json({ success: true, data: users });

            case 'POST':
                // Create new user
                const newUser = req.body;
                const hashedPassword = await bcrypt.hash(newUser.password, 10);
                
                const [result] = await pool.execute(
                    `INSERT INTO users (name, email, password, role)
                     VALUES (?, ?, ?, ?)`,
                    [
                        newUser.name,
                        newUser.email,
                        hashedPassword,
                        newUser.role || 'customer'
                    ]
                );
                
                const [createdUser] = await pool.execute(
                    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
                    [result.insertId]
                );
                
                return res.status(201).json({ 
                    success: true, 
                    data: createdUser[0]
                });

            case 'PUT':
                // Update user
                const updateUser = req.body;
                const updates = [];
                const values = [];

                if (updateUser.name) {
                    updates.push('name = ?');
                    values.push(updateUser.name);
                }
                if (updateUser.email) {
                    updates.push('email = ?');
                    values.push(updateUser.email);
                }
                if (updateUser.password) {
                    updates.push('password = ?');
                    values.push(await bcrypt.hash(updateUser.password, 10));
                }
                if (updateUser.role) {
                    updates.push('role = ?');
                    values.push(updateUser.role);
                }

                if (updates.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'No fields to update'
                    });
                }

                values.push(updateUser.id);
                await pool.execute(
                    `UPDATE users 
                     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    values
                );

                const [updatedUser] = await pool.execute(
                    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
                    [updateUser.id]
                );

                return res.status(200).json({
                    success: true,
                    data: updatedUser[0]
                });

            case 'DELETE':
                // Delete user
                const { id } = req.query;
                
                // Don't allow deleting the last admin
                const [adminCount] = await pool.execute(
                    'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
                );
                const [userToDelete] = await pool.execute(
                    'SELECT role FROM users WHERE id = ?',
                    [id]
                );

                if (adminCount[0].count === 1 && userToDelete[0]?.role === 'admin') {
                    return res.status(400).json({
                        success: false,
                        error: 'Cannot delete the last admin user'
                    });
                }

                await pool.execute('DELETE FROM users WHERE id = ?', [id]);
                return res.status(200).json({ success: true });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ 
                    success: false, 
                    error: `Method ${req.method} Not Allowed` 
                });
        }
    } catch (error) {
        console.error('User management error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message
        });
    }
} 