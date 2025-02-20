import { getSession } from 'next-auth/react';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default async function handler(req, res) {
    const session = await getSession({ req });

    if (!session || session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const [users] = await pool.execute(
                    'SELECT id, name, email, role, created_at, updated_at FROM users'
                );
                res.status(200).json(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ error: 'Failed to fetch users' });
            }
            break;

        case 'POST':
            try {
                const { name, email, password, role = 'customer' } = req.body;

                // Check if user already exists
                const [existingUsers] = await pool.execute(
                    'SELECT id FROM users WHERE email = ?',
                    [email]
                );

                if (existingUsers.length > 0) {
                    return res.status(400).json({ error: 'Email already exists' });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create user
                const [result] = await pool.execute(
                    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                    [name, email, hashedPassword, role]
                );

                const [newUser] = await pool.execute(
                    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
                    [result.insertId]
                );

                res.status(201).json(newUser[0]);
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({ error: 'Failed to create user' });
            }
            break;

        case 'PUT':
            try {
                const { id } = req.query;
                const updates = req.body;

                // If password is being updated, hash it
                if (updates.password) {
                    updates.password = await bcrypt.hash(updates.password, 10);
                }

                const fields = Object.keys(updates)
                    .filter(key => key !== 'id')
                    .map(key => `${key} = ?`)
                    .join(', ');

                const values = Object.keys(updates)
                    .filter(key => key !== 'id')
                    .map(key => updates[key]);

                const [result] = await pool.execute(
                    `UPDATE users SET ${fields} WHERE id = ?`,
                    [...values, id]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const [updatedUser] = await pool.execute(
                    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
                    [id]
                );

                res.status(200).json(updatedUser[0]);
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).json({ error: 'Failed to update user' });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;

                // Check if user exists
                const [existingUser] = await pool.execute(
                    'SELECT role FROM users WHERE id = ?',
                    [id]
                );

                if (existingUser.length === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Prevent deleting the last admin
                if (existingUser[0].role === 'admin') {
                    const [adminCount] = await pool.execute(
                        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
                    );
                    
                    if (adminCount[0].count <= 1) {
                        return res.status(400).json({
                            error: 'Cannot delete the last admin user'
                        });
                    }
                }

                const [result] = await pool.execute(
                    'DELETE FROM users WHERE id = ?',
                    [id]
                );

                res.status(200).json({ message: 'User deleted successfully' });
            } catch (error) {
                console.error('Error deleting user:', error);
                res.status(500).json({ error: 'Failed to delete user' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
} 