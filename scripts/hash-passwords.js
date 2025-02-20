const bcrypt = require('bcryptjs');
const { executeQuery } = require('../lib/mysql');

async function hashPasswords() {
    try {
        // Get all users
        const result = await executeQuery('SELECT id, password FROM users');
        if (!result.success) {
            throw new Error('Failed to fetch users');
        }

        const users = result.data;
        console.log(`Found ${users.length} users to process`);

        // Update each user's password if not already hashed
        for (const user of users) {
            if (!user.password.startsWith('$2')) {
                const hashedPassword = await bcrypt.hash(user.password, 12);
                const updateResult = await executeQuery(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [hashedPassword, user.id]
                );

                if (!updateResult.success) {
                    console.error(`Failed to update password for user ${user.id}`);
                    continue;
                }

                console.log(`Updated password for user ${user.id}`);
            }
        }

        console.log('Password hashing completed successfully');
    } catch (error) {
        console.error('Error hashing passwords:', error);
        process.exit(1);
    }
}

async function resetAdminPassword() {
    try {
        console.log('Resetting admin password...');
        const adminEmail = 'admin@kappy.com';
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        // Update admin password in database
        const result = await executeQuery(
            'UPDATE users SET password = ? WHERE email = ? AND role = ?',
            [hashedPassword, adminEmail, 'admin']
        );

        if (!result.success) {
            throw new Error('Failed to update admin password');
        }

        if (result.data.affectedRows === 0) {
            // Admin user doesn't exist, create it
            const createResult = await executeQuery(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', adminEmail, hashedPassword, 'admin']
            );

            if (!createResult.success) {
                throw new Error('Failed to create admin user');
            }

            console.log('Admin user created with default password');
        } else {
            console.log('Admin password reset successfully');
        }
    } catch (error) {
        console.error('Error resetting admin password:', error);
        process.exit(1);
    }
}

// Run both operations
async function main() {
    await hashPasswords();
    await resetAdminPassword();
}

main()
    .then(() => {
        console.log('All password operations completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    }); 