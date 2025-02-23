import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        console.log('Attempting to create user:', { name, email });

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser.success && existingUser.data) {
            console.log('User already exists:', email);
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate unique user ID
        const userId = require('crypto').randomUUID();

        // Create user
        const result = await createUser({
            id: userId,
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'customer'
        });

        if (!result.success) {
            console.error('Failed to create user:', result.error);
            throw new Error(result.error || 'Failed to create user');
        }

        console.log('User created successfully:', { id: result.data.id, email: result.data.email });

        // Return success without sensitive data
        res.status(201).json({ 
            success: true,
            message: 'User created successfully',
            user: {
                id: result.data.id,
                name: result.data.name,
                email: result.data.email,
                role: result.data.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create user',
            message: error.message
        });
    }
} 