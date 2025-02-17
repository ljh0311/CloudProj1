import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const productsPath = path.join(process.cwd(), 'data', 'products.json');
const usersPath = path.join(process.cwd(), 'data', 'users.json');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Products operations
export const getProducts = () => {
    try {
        const data = fs.readFileSync(productsPath, 'utf8');
        return JSON.parse(data).products;
    } catch (error) {
        console.error('Error reading products:', error);
        return [];
    }
};

export const addProduct = (product) => {
    try {
        const data = fs.readFileSync(productsPath, 'utf8');
        const { products, lastId } = JSON.parse(data);
        const newProduct = {
            ...product,
            id: lastId + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        
        fs.writeFileSync(productsPath, JSON.stringify({
            products,
            lastId: lastId + 1
        }, null, 4));
        
        return newProduct;
    } catch (error) {
        console.error('Error adding product:', error);
        throw new Error('Failed to add product');
    }
};

export const updateProduct = (id, updates) => {
    try {
        const data = fs.readFileSync(productsPath, 'utf8');
        const { products, lastId } = JSON.parse(data);
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) throw new Error('Product not found');
        
        products[index] = {
            ...products[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(productsPath, JSON.stringify({ products, lastId }, null, 4));
        return products[index];
    } catch (error) {
        console.error('Error updating product:', error);
        throw new Error('Failed to update product');
    }
};

export const deleteProduct = (id) => {
    try {
        const data = fs.readFileSync(productsPath, 'utf8');
        const { products, lastId } = JSON.parse(data);
        const index = products.findIndex(p => p.id === id);
        
        if (index === -1) throw new Error('Product not found');
        
        products.splice(index, 1);
        fs.writeFileSync(productsPath, JSON.stringify({ products, lastId }, null, 4));
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw new Error('Failed to delete product');
    }
};

// Users operations
export const getUsers = () => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
};

export const getUserByEmail = (email) => {
    try {
        const users = getUsers();
        return users.find(user => user.email === email);
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
};

export const addUser = (user) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const newUser = {
            ...user,
            id: lastId + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            orders: [],
            cart: []
        };
        
        users.push(newUser);
        
        fs.writeFileSync(usersPath, JSON.stringify({
            users,
            lastId: lastId + 1
        }, null, 4));
        
        return newUser;
    } catch (error) {
        console.error('Error adding user:', error);
        throw new Error('Failed to add user');
    }
};

export const updateUser = (id, updates) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const index = users.findIndex(u => u.id === id);
        
        if (index === -1) throw new Error('User not found');
        
        users[index] = {
            ...users[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(usersPath, JSON.stringify({ users, lastId }, null, 4));
        return users[index];
    } catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Failed to update user');
    }
};

export const updateUserCart = (userId, cart) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) throw new Error('User not found');
        
        users[index].cart = cart;
        users[index].updatedAt = new Date().toISOString();
        
        fs.writeFileSync(usersPath, JSON.stringify({ users, lastId }, null, 4));
        return users[index];
    } catch (error) {
        console.error('Error updating user cart:', error);
        throw new Error('Failed to update user cart');
    }
};

export const addOrder = (userId, order) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) throw new Error('User not found');
        
        users[index].orders.push({
            ...order,
            id: Date.now(),
            createdAt: new Date().toISOString()
        });
        users[index].updatedAt = new Date().toISOString();
        
        fs.writeFileSync(usersPath, JSON.stringify({ users, lastId }, null, 4));
        return users[index].orders[users[index].orders.length - 1];
    } catch (error) {
        console.error('Error adding order:', error);
        throw new Error('Failed to add order');
    }
};

// MySQL user operations
export const getMySQLUserByEmail = async (email) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
};

export const createMySQLUser = async (userData) => {
    try {
        const { name, email, password, role = 'customer' } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return result.insertId;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
};

// Fallback to JSON if database connection fails
export const getUserByEmailFallback = (email) => {
    try {
        const users = getUsers();
        return users.find(user => user.email === email);
    } catch (error) {
        console.error('Error finding user:', error);
        return null;
    }
};

export const addUserFallback = (user) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const newUser = {
            ...user,
            id: lastId + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            orders: [],
            cart: []
        };
        
        users.push(newUser);
        
        fs.writeFileSync(usersPath, JSON.stringify({
            users,
            lastId: lastId + 1
        }, null, 4));
        
        return newUser;
    } catch (error) {
        console.error('Error adding user:', error);
        throw new Error('Failed to add user');
    }
};

export const updateUserFallback = (id, updates) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const index = users.findIndex(u => u.id === id);
        
        if (index === -1) throw new Error('User not found');
        
        users[index] = {
            ...users[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(usersPath, JSON.stringify({ users, lastId }, null, 4));
        return users[index];
    } catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Failed to update user');
    }
};

export const updateUserCartFallback = (userId, cart) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) throw new Error('User not found');
        
        users[index].cart = cart;
        users[index].updatedAt = new Date().toISOString();
        
        fs.writeFileSync(usersPath, JSON.stringify({ users, lastId }, null, 4));
        return users[index];
    } catch (error) {
        console.error('Error updating user cart:', error);
        throw new Error('Failed to update user cart');
    }
};

export const addOrderFallback = (userId, order) => {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        const { users, lastId } = JSON.parse(data);
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) throw new Error('User not found');
        
        users[index].orders.push({
            ...order,
            id: Date.now(),
            createdAt: new Date().toISOString()
        });
        users[index].updatedAt = new Date().toISOString();
        
        fs.writeFileSync(usersPath, JSON.stringify({ users, lastId }, null, 4));
        return users[index].orders[users[index].orders.length - 1];
    } catch (error) {
        console.error('Error adding order:', error);
        throw new Error('Failed to add order');
    }
}; 