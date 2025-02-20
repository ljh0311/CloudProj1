import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupDatabasePermissions() {
    // First connect as the admin user
    const adminConfig = {
        host: process.env.MYSQL_HOST,
        user: 'admin', // RDS default admin user
        password: process.env.MYSQL_ADMIN_PASSWORD, // Add this to your .env.local
        database: process.env.MYSQL_DATABASE
    };

    try {
        console.log('Connecting to database as admin...');
        const connection = await mysql.createConnection(adminConfig);

        // Create the database if it doesn't exist
        console.log('Creating database if not exists...');
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`);

        // Grant permissions to root user from EC2 instance
        console.log('Granting permissions to root user...');
        await connection.execute(`
            GRANT ALL PRIVILEGES ON ${process.env.MYSQL_DATABASE}.* 
            TO 'root'@'%' 
            IDENTIFIED BY ?
        `, [process.env.MYSQL_PASSWORD]);

        // Apply the privileges
        console.log('Flushing privileges...');
        await connection.execute('FLUSH PRIVILEGES');

        console.log('Database permissions setup completed successfully!');
        
        // Test the connection as root
        await connection.end();
        
        console.log('Testing connection as root user...');
        const rootConnection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        console.log('Root user connection successful!');
        await rootConnection.end();

    } catch (error) {
        console.error('Error setting up database permissions:', error);
        throw error;
    }
}

// Run the setup
setupDatabasePermissions()
    .then(() => {
        console.log('Setup completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    }); 