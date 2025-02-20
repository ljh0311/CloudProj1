import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '../../../lib/db-service';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser.success && existingUser.data) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with proper fields
        const result = await createUser({
            name,
            email,
            password: hashedPassword,
            role: 'customer'  // Default role
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        // Return success without exposing sensitive data
        res.status(201).json({ 
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
        res.status(500).json({ error: 'Failed to create user' });
    }
} 