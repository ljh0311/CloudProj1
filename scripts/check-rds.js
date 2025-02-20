import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from all env files
function loadEnvFiles() {
    const envFiles = ['.env', '.env.local', '.env.production'];
    const envVars = {};

    envFiles.forEach(file => {
        try {
            const envPath = path.join(process.cwd(), file);
            if (fs.existsSync(envPath)) {
                const envConfig = dotenv.parse(fs.readFileSync(envPath));
                Object.assign(envVars, envConfig);
                console.log(`✅ Loaded ${file}`);
            } else {
                console.log(`⚠️ ${file} not found`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${file}:`, error.message);
        }
    });

    return envVars;
}

async function checkRDSConnection() {
    console.log('\n🔍 Starting RDS connection check...');
    
    // Load all environment variables
    const envVars = loadEnvFiles();
    
    // Log database configuration (without password)
    console.log('\n📋 Database Configuration:');
    console.log({
        MYSQL_HOST: envVars.MYSQL_HOST,
        MYSQL_USER: envVars.MYSQL_USER,
        MYSQL_DATABASE: envVars.MYSQL_DATABASE,
        NODE_ENV: envVars.NODE_ENV
    });

    const dbConfig = {
        host: envVars.MYSQL_HOST,
        user: envVars.MYSQL_USER,
        password: envVars.MYSQL_PASSWORD,
        database: envVars.MYSQL_DATABASE,
        ssl: envVars.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    };

    let connection;
    try {
        console.log('\n🔌 Attempting to connect to RDS...');
        connection = await mysql.createConnection(dbConfig);
        
        // Test the connection
        console.log('✅ Successfully connected to RDS');
        
        // Check if we can query the database
        console.log('\n🔍 Testing database queries...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log('✅ Successfully queried database');
        console.log('📊 Found tables:', tables.map(t => Object.values(t)[0]));

        // Check users table
        console.log('\n👥 Checking users table...');
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Users table contains ${users[0].count} records`);

        // Check products table
        console.log('\n📦 Checking products table...');
        const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
        console.log(`✅ Products table contains ${products[0].count} records`);

        // Check orders table
        console.log('\n🛍️ Checking orders table...');
        const [orders] = await connection.query('SELECT COUNT(*) as count FROM orders');
        console.log(`✅ Orders table contains ${orders[0].count} records`);

        console.log('\n✅ All database checks passed successfully!');
    } catch (error) {
        console.error('\n❌ RDS Connection Error:', error.message);
        console.log('\n🔍 Troubleshooting steps:');
        console.log('1. Verify environment variables are correctly set');
        console.log('2. Check AWS RDS instance status');
        console.log('3. Verify security group inbound rules (port 3306)');
        console.log('4. Check network ACLs');
        console.log('5. Verify database credentials');
        
        // Additional error context
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔑 Authentication failed. Please check:');
            console.log('- Database username is correct');
            console.log('- Database password is correct');
            console.log('- User has necessary permissions');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n🌐 Connection refused. Please check:');
            console.log('- RDS instance is running');
            console.log('- Security group allows inbound traffic from your IP');
            console.log('- Database endpoint is correct');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n📚 Database not found. Please check:');
            console.log('- Database name is correct');
            console.log('- Database exists on the RDS instance');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the check
checkRDSConnection()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    }); 