import { spawn } from 'child_process';

export default async function handler(req, res) {
    // Check if method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { script } = req.body;

    // Validate script name
    const allowedScripts = [
        'check-deployment.js',
        'update-ip.js',
        'migrate-db.js',
        'migrate-orders.js',
        'sync-data.js',
        'hash-passwords.js'
    ];

    if (!allowedScripts.includes(script)) {
        return res.status(400).json({ error: 'Invalid script name' });
    }

    try {
        // Run the script
        const scriptProcess = spawn('node', [`scripts/${script}`], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        // Collect output
        scriptProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        scriptProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Handle script completion
        scriptProcess.on('close', (code) => {
            if (code === 0) {
                res.status(200).json({
                    success: true,
                    output: output,
                    message: `Script ${script} executed successfully`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: error || 'Script execution failed',
                    output: output
                });
            }
        });

        // Handle script errors
        scriptProcess.on('error', (err) => {
            res.status(500).json({
                success: false,
                error: err.message
            });
        });

    } catch (error) {
        console.error('Error running script:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
} 