import fs from 'fs/promises';
import path from 'path';

// Helper function to read users data
async function getUsers() {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
}

// Helper function to write users data
async function writeUsers(data) {
    const filePath = path.join(process.cwd(), 'data', 'users.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// TODO: MySQL implementation
// This will be replaced with MySQL queries when moving to RDS
async function getMySQLUsers() {
    // const connection = await mysql.createConnection({
    //     host: process.env.DB_HOST,
    //     user: process.env.DB_USER,
    //     password: process.env.DB_PASSWORD,
    //     database: process.env.DB_NAME
    // });
    // const [rows] = await connection.execute('SELECT * FROM users');
    // await connection.end();
    // return rows;
}

export default async function handler(req, res) {
    // Check if user is admin (implement proper auth check)
    // if (!isAdmin) {
    //     return res.status(403).json({ error: 'Unauthorized' });
    // }

    try {
        switch (req.method) {
            case 'GET':
                const data = await getUsers();
                res.status(200).json(data.users);
                break;

            case 'POST':
                const usersData = await getUsers();
                const newUser = {
                    ...req.body,
                    id: usersData.lastId + 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    orders: [],
                    cart: []
                };
                usersData.users.push(newUser);
                usersData.lastId = newUser.id;
                await writeUsers(usersData);
                res.status(201).json(newUser);
                break;

            case 'PUT':
                const { id, ...updateData } = req.body;
                const existingData = await getUsers();
                const userIndex = existingData.users.findIndex(u => u.id === id);
                
                if (userIndex === -1) {
                    return res.status(404).json({ error: 'User not found' });
                }

                existingData.users[userIndex] = {
                    ...existingData.users[userIndex],
                    ...updateData,
                    updatedAt: new Date().toISOString()
                };

                await writeUsers(existingData);
                res.status(200).json(existingData.users[userIndex]);
                break;

            case 'DELETE':
                const { id: deleteId } = req.query;
                const currentData = await getUsers();
                currentData.users = currentData.users.filter(u => u.id !== parseInt(deleteId));
                await writeUsers(currentData);
                res.status(200).json({ message: 'User deleted successfully' });
                break;

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error handling user request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 