import fs from 'fs/promises';
import path from 'path';

// Helper function to read products data
async function getProducts() {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
}

// Helper function to write products data
async function writeProducts(data) {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// TODO: MySQL implementation
// This will be replaced with MySQL queries when moving to RDS
async function getMySQLProducts() {
    // const connection = await mysql.createConnection({
    //     host: process.env.DB_HOST,
    //     user: process.env.DB_USER,
    //     password: process.env.DB_PASSWORD,
    //     database: process.env.DB_NAME
    // });
    // const [rows] = await connection.execute('SELECT * FROM products');
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
                const data = await getProducts();
                res.status(200).json(data.products);
                break;

            case 'POST':
                const productsData = await getProducts();
                const newProduct = {
                    ...req.body,
                    id: productsData.lastId + 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                productsData.products.push(newProduct);
                productsData.lastId = newProduct.id;
                await writeProducts(productsData);
                res.status(201).json(newProduct);
                break;

            case 'PUT':
                const { id, ...updateData } = req.body;
                const existingData = await getProducts();
                const productIndex = existingData.products.findIndex(p => p.id === id);
                
                if (productIndex === -1) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                existingData.products[productIndex] = {
                    ...existingData.products[productIndex],
                    ...updateData,
                    updatedAt: new Date().toISOString()
                };

                await writeProducts(existingData);
                res.status(200).json(existingData.products[productIndex]);
                break;

            case 'DELETE':
                const { id: deleteId } = req.query;
                const currentData = await getProducts();
                currentData.products = currentData.products.filter(p => p.id !== parseInt(deleteId));
                await writeProducts(currentData);
                res.status(200).json({ message: 'Product deleted successfully' });
                break;

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error handling product request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 