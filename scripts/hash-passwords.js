const bcrypt = require('bcryptjs');
const { readJsonFile, writeJsonFile } = require('../utils/jsonOperations');

async function hashPasswords() {
    try {
        console.log('Reading users.json...');
        const { users } = await readJsonFile('users.json');

        console.log('Hashing passwords...');
        const updatedUsers = await Promise.all(users.map(async (user) => {
            // Only hash if password isn't already hashed (bcrypt passwords start with $2a$ or $2b$)
            if (!user.password.startsWith('$2')) {
                const hashedPassword = await bcrypt.hash(user.password, 12);
                return { ...user, password: hashedPassword };
            }
            return user;
        }));

        const updatedData = {
            users: updatedUsers,
            lastId: users.length
        };

        console.log('Writing updated users back to file...');
        await writeJsonFile('users.json', updatedData);

        console.log('✅ Password hashing complete!');
    } catch (error) {
        console.error('Error hashing passwords:', error);
        process.exit(1);
    }
}

async function resetAdminPassword() {
    try {
        console.log('Reading users.json...');
        const { users } = await readJsonFile('users.json');

        console.log('Updating admin password...');
        const updatedUsers = users.map(async (user) => {
            if (user.email === 'admin@kappy.com') {
                // Set admin password to 'admin123'
                const hashedPassword = await bcrypt.hash('admin123', 12);
                return { ...user, password: hashedPassword };
            }
            return user;
        });

        const resolvedUsers = await Promise.all(updatedUsers);

        const updatedData = {
            users: resolvedUsers,
            lastId: users.length
        };

        console.log('Writing updated users back to file...');
        await writeJsonFile('users.json', updatedData);

        console.log('✅ Admin password reset complete!');
    } catch (error) {
        console.error('Error resetting admin password:', error);
        process.exit(1);
    }
}

hashPasswords();
resetAdminPassword(); 