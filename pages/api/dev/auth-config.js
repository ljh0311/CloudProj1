import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
    try {
        // Get the current EC2 instance IP
        let instanceIP = '';
        try {
            const { stdout } = await execAsync('curl -s http://169.254.169.254/latest/meta-data/public-ipv4');
            instanceIP = stdout.trim();
        } catch (error) {
            console.error('Error getting instance IP:', error);
            instanceIP = 'Could not retrieve instance IP';
        }

        // Return environment configuration
        res.status(200).json({
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            instanceIP,
            NODE_ENV: process.env.NODE_ENV,
            // Don't expose sensitive information like secrets or passwords
        });
    } catch (error) {
        console.error('Error in auth-config:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve auth configuration',
            message: error.message 
        });
    }
} 