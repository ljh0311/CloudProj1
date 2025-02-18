require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const NEW_IP = '54.159.253.0';

async function updateConfigurations() {
    try {
        // Update .env files
        const envFiles = ['.env', '.env.local', '.env.production'];
        
        for (const envFile of envFiles) {
            try {
                const envPath = path.join(process.cwd(), envFile);
                const envContent = await fs.readFile(envPath, 'utf8');
                
                // Update any IP-related configurations
                const updatedContent = envContent
                    .replace(/^NEXTAUTH_URL=.*/m, `NEXTAUTH_URL=http://${NEW_IP}:3000`)
                    .replace(/^NEXT_PUBLIC_API_URL=.*/m, `NEXT_PUBLIC_API_URL=http://${NEW_IP}:3000/api`);
                
                await fs.writeFile(envPath, updatedContent);
                console.log(`✅ Updated ${envFile}`);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error(`Error updating ${envFile}:`, err);
                }
            }
        }

        // Update next.config.js
        const nextConfigPath = path.join(process.cwd(), 'next.config.js');
        try {
            let nextConfig = await fs.readFile(nextConfigPath, 'utf8');
            nextConfig = nextConfig.replace(
                /hostname:\s*\[([^\]]+)\]/g,
                `hostname: ['${NEW_IP}', 'localhost']`
            );
            await fs.writeFile(nextConfigPath, nextConfig);
            console.log('✅ Updated next.config.js');
        } catch (err) {
            console.error('Error updating next.config.js:', err);
        }

        // Add the new IP to scripts
        const updateScript = `
#!/bin/bash

# Update package lists
sudo apt-get update

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Navigate to application directory
cd /home/ubuntu/kappy

# Install dependencies
npm install

# Build the application
npm run build

# Start/Restart the application with PM2
pm2 restart kappy || pm2 start npm --name "kappy" -- start

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "Deployment completed successfully!"
`;

        await fs.writeFile(path.join(process.cwd(), 'scripts', 'deploy.sh'), updateScript, { mode: 0o755 });
        console.log('✅ Created deploy.sh script');

        console.log('\n✨ IP configuration update completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Commit and push these changes to your repository');
        console.log('2. SSH into your EC2 instance');
        console.log('3. Pull the latest changes');
        console.log('4. Run: chmod +x scripts/deploy.sh');
        console.log('5. Run: ./scripts/deploy.sh');
        console.log('\nMake sure to update your security group to allow traffic from the new IP!');

    } catch (error) {
        console.error('Error updating IP configurations:', error);
        process.exit(1);
    }
}

updateConfigurations(); 