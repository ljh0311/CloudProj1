import fs from 'fs';
import path from 'path';
// TODO: Uncomment the following line when MySQL RDS is set up
// import { query } from '../utils/db.js';

// TODO: Uncomment and use these functions when MySQL RDS is set up
/*
async function migrateProducts() {
    try {
        const productsData = JSON.parse(
            fs.readFileSync(
                path.join(process.cwd(), 'data', 'products.json'),
                'utf8'
            )
        );

        for (const product of productsData.products) {
            await query(
                `INSERT INTO products (
                    id, name, price, category, image, condition_status, 
                    size, description, material, stock, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.id,
                    product.name,
                    product.price,
                    product.category,
                    product.image,
                    product.condition,
                    product.size,
                    product.description,
                    product.material,
                    product.stock,
                    new Date(product.createdAt),
                    new Date(product.updatedAt)
                ]
            );
        }
        console.log('Products data migration completed successfully');
    } catch (error) {
        console.error('Error migrating products data:', error);
    }
}

async function migrateUsers() {
    try {
        const usersData = JSON.parse(
            fs.readFileSync(
                path.join(process.cwd(), 'data', 'users.json'),
                'utf8'
            )
        );

        for (const user of usersData.users) {
            await query(
                `INSERT INTO users (
                    id, email, name, password, role, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.id,
                    user.email,
                    user.name,
                    user.password,
                    user.role,
                    new Date(user.createdAt),
                    new Date(user.updatedAt)
                ]
            );
        }
        console.log('Users data migration completed successfully');
    } catch (error) {
        console.error('Error migrating users data:', error);
    }
}

// Run migrations
async function runMigrations() {
    try {
        await migrateProducts();
        await migrateUsers();
        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
*/

// Temporary placeholder for when MySQL is disabled
console.log('MySQL migration is currently disabled. The application is using JSON files for data storage.');
console.log('To enable MySQL:');
console.log('1. Set up your AWS RDS instance');
console.log('2. Configure your .env file with database credentials');
console.log('3. Uncomment the MySQL code in utils/db.js and scripts/migrate-data.js');
console.log('4. Run this script again to migrate your data'); 