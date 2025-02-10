import { readJsonFile, writeJsonFile } from '../../../utils/jsonOperations';
import bcrypt from 'bcryptjs';

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

        // Read existing users
        const { users } = await readJsonFile('users.json');

        // Check if user already exists
        if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'customer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            orders: [],
            cart: []
        };

        // Add user to database
        const updatedUsers = {
            users: [...users, newUser],
            lastId: newUser.id
        };

        await writeJsonFile('users.json', updatedUsers);

        // Return success without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
} 