import bcrypt from 'bcryptjs';
import { createMySQLUser, getMySQLUserByEmail, addUserFallback, getUserByEmailFallback } from '../../../utils/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists in MySQL first
        let existingUser = await getMySQLUserByEmail(email);
        
        // If MySQL check fails, check JSON
        if (!existingUser) {
            existingUser = await getUserByEmailFallback(email);
        }

        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user object
        const newUser = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'customer'
        };

        try {
            // Try to create user in MySQL first
            const userId = await createMySQLUser(newUser);
            newUser.id = userId;
        } catch (dbError) {
            console.error('MySQL creation failed, falling back to JSON:', dbError);
            // If MySQL fails, fall back to JSON
            const createdUser = await addUserFallback(newUser);
            newUser.id = createdUser.id;
        }

        // Return success without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
} 