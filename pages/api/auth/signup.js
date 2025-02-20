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
            console.error('Missing required fields:', { name: !!name, email: !!email, password: !!password });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('Attempting to create user:', { name, email });

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser.success && existingUser.data) {
            console.log('User already exists:', email);
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
            console.error('Failed to create user:', result.error);
            throw new Error(result.error || 'Failed to create user');
        }

        console.log('User created successfully:', { id: result.data.id, email: result.data.email });

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
        res.status(500).json({ 
            error: 'Failed to create user',
            details: error.message
        });
    }
} 