import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// JSON file operations
export async function readJsonFile(type) {
    try {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        const data = await fs.readFile(filePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error(`Error reading ${type}.json:`, error);
        return { success: false, error: error.message };
    }
}

export async function writeJsonFile(type, data) {
    try {
        const filePath = path.join(process.cwd(), 'data', `${type}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        console.error(`Error writing ${type}.json:`, error);
        return { success: false, error: error.message };
    }
}

// Database operations
export async function executeQuery(query, params = [], jsonFallback = null) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('MySQL Error:', error);
        if (jsonFallback) {
            console.log('Falling back to JSON data');
            const jsonData = await readJsonFile(jsonFallback);
            return jsonData;
        }
        throw error;
    }
}

// Export named functions and objects
const dbOperations = {
    readJsonFile,
    writeJsonFile,
    executeQuery,
    pool
};

export default dbOperations; 