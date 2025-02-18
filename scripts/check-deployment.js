const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

async function checkDeployment() {
    console.log('🔍 Starting deployment diagnostics...\n');
    const results = {
        environment: {},
        network: {},
        database: {},
        authentication: {},
        files: {}
    };

    try {
        // Check environment variables
        console.log('📋 Checking environment variables...');
        const envFiles = ['.env', '.env.local', '.env.production'];
        for (const envFile of envFiles) {
            try {
                const envPath = path.join(process.cwd(), envFile);
                const envContent = await fs.readFile(envPath, 'utf8');
                const envVars = envContent.split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .reduce((acc, line) => {
                        const [key] = line.split('=');
                        acc[key] = '✓';
                        return acc;
                    }, {});
                results.environment[envFile] = envVars;
                console.log(`✅ Found ${envFile} with ${Object.keys(envVars).length} variables`);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    console.log(`⚠️ ${envFile} not found`);
                    results.environment[envFile] = 'Not found';
                } else {
                    console.error(`❌ Error reading ${envFile}:`, err.message);
                    results.environment[envFile] = `Error: ${err.message}`;
                }
            }
        }

        // Check network connectivity
        console.log('\n🌐 Checking network connectivity...');
        let ip;
        try {
            // Try to get IP from EC2 metadata
            ip = execSync('curl -s http://169.254.169.254/latest/meta-data/public-ipv4').toString().trim();
        } catch (err) {
            // Fallback to provided IP
            ip = '54.159.253.0';
        }
        results.network.publicIP = ip;
        console.log(`✅ Public IP: ${ip}`);

        // Check ports
        const ports = [80, 443, 3000];
        for (const port of ports) {
            try {
                const netstat = execSync(`netstat -tuln | grep :${port}`).toString();
                results.network[`port${port}`] = 'Open';
                console.log(`✅ Port ${port} is open`);
            } catch (err) {
                results.network[`port${port}`] = 'Closed';
                console.log(`❌ Port ${port} appears to be closed`);
            }
        }

        // Check API endpoints
        console.log('\n🔌 Checking API endpoints...');
        const endpoints = [
            { url: `http://${ip}:3000/api/health`, name: 'Health Check' },
            { url: `http://${ip}:3000/api/auth/session`, name: 'Auth Session' },
            { url: `http://${ip}:3000/api/dev/json-data`, name: 'JSON Data' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await new Promise((resolve, reject) => {
                    const req = http.get(endpoint.url, {
                        timeout: 5000,
                        headers: {
                            'Host': `${ip}:3000`
                        }
                    }, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve({ status: res.statusCode, data }));
                    });
                    
                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('Request timed out'));
                    });
                });
                
                results.network[endpoint.name] = `Status: ${response.status}`;
                console.log(`✅ ${endpoint.name}: Status ${response.status}`);
            } catch (err) {
                results.network[endpoint.name] = `Error: ${err.message}`;
                console.log(`❌ ${endpoint.name}: ${err.message}`);
            }
        }

        // Check Node.js and PM2
        console.log('\n⚙️ Checking system configuration...');
        try {
            const nodeVersion = execSync('node -v').toString().trim();
            const npmVersion = execSync('npm -v').toString().trim();
            const pm2List = execSync('pm2 list').toString();
            
            results.environment.node = nodeVersion;
            results.environment.npm = npmVersion;
            results.environment.pm2 = pm2List.includes('kappy') ? 'Running' : 'Not running';

            console.log(`✅ Node.js: ${nodeVersion}`);
            console.log(`✅ npm: ${npmVersion}`);
            console.log(`✅ PM2 status: ${results.environment.pm2}`);
        } catch (err) {
            console.log('❌ Error checking system:', err.message);
            results.environment.system = `Error: ${err.message}`;
        }

        // Check MySQL connection
        console.log('\n🗄️ Checking MySQL connection...');
        try {
            const mysqlStatus = execSync('systemctl is-active mysql').toString().trim();
            results.database.mysql = mysqlStatus === 'active' ? 'Running' : 'Not running';
            console.log(`✅ MySQL service: ${results.database.mysql}`);
        } catch (err) {
            results.database.mysql = 'Not running';
            console.log('❌ MySQL service is not running');
        }

        // Check file permissions
        console.log('\n📁 Checking file permissions...');
        const criticalFiles = [
            'next.config.js',
            'package.json',
            'scripts/deploy.sh'
        ];

        for (const file of criticalFiles) {
            try {
                const stats = await fs.stat(file);
                results.files[file] = {
                    permissions: stats.mode.toString(8).slice(-3),
                    size: `${(stats.size / 1024).toFixed(2)}KB`
                };
                console.log(`✅ ${file}: ${results.files[file].permissions} (${results.files[file].size})`);
            } catch (err) {
                results.files[file] = `Error: ${err.message}`;
                console.log(`❌ ${file}: ${err.message}`);
            }
        }

        // Final summary
        console.log('\n📊 Diagnostic Summary:');
        console.log(JSON.stringify(results, null, 2));

        // Provide recommendations
        console.log('\n💡 Recommendations:');
        if (results.network.port80 === 'Closed') {
            console.log('- Configure security group to allow HTTP traffic (port 80)');
        }
        if (results.network.port443 === 'Closed') {
            console.log('- Configure security group to allow HTTPS traffic (port 443)');
        }
        if (results.network.port3000 === 'Closed') {
            console.log('- Configure security group to allow Next.js traffic (port 3000)');
        }
        if (results.environment.pm2 !== 'Running') {
            console.log('- Start the application using PM2: pm2 start npm --name "kappy" -- start');
        }
        if (results.database.mysql !== 'Running') {
            console.log('- Start MySQL service: sudo systemctl start mysql');
        }

        // Check environment variables
        const envWarnings = [];
        if (!results.environment['.env.production']?.NEXTAUTH_URL) {
            envWarnings.push('- Set NEXTAUTH_URL in .env.production');
        }
        if (!results.environment['.env.production']?.NEXT_PUBLIC_API_URL) {
            envWarnings.push('- Set NEXT_PUBLIC_API_URL in .env.production');
        }
        if (envWarnings.length > 0) {
            console.log('\n⚠️ Environment variable recommendations:');
            envWarnings.forEach(warning => console.log(warning));
        }

    } catch (error) {
        console.error('❌ Error during diagnostics:', error);
        process.exit(1);
    }
}

checkDeployment(); 