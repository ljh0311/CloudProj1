try {
    require('dotenv').config();
} catch (error) {
    console.log('⚠️ dotenv package not found, installing...');
    require('child_process').execSync('npm install dotenv', { stdio: 'inherit' });
    require('dotenv').config();
}

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const NEW_IP = '54.159.253.0';

async function updateConfigurations() {
    try {
        // Ensure all required packages are installed
        const requiredPackages = ['dotenv'];
        for (const pkg of requiredPackages) {
            try {
                require.resolve(pkg);
            } catch (error) {
                console.log(`⚠️ Installing ${pkg}...`);
                execSync(`npm install ${pkg}`, { stdio: 'inherit' });
            }
        }

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
        const updateScript = `#!/bin/bash

# Update package lists
sudo yum update -y

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Navigate to application directory
cd /home/ec2-user/app/CloudProj1

# Install dependencies
npm install

# Build the application
npm run build

# Start/Restart the application with PM2
pm2 restart kappy || pm2 start npm --name "kappy" -- start

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "Deployment completed successfully!"
`;

        await fs.writeFile(path.join(process.cwd(), 'scripts', 'deploy.sh'), updateScript, { mode: 0o755 });
        console.log('✅ Created deploy.sh script');

        console.log('\n✨ IP configuration update completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: chmod +x scripts/deploy.sh');
        console.log('2. Run: ./scripts/deploy.sh');
        console.log('\nMake sure to update your security group to allow traffic from the new IP!');

    } catch (error) {
        console.error('Error updating IP configurations:', error);
        process.exit(1);
    }
}

updateConfigurations(); 