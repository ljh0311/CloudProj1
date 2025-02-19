const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk'); // You'll need to install this: npm install chalk

async function readFile(filePath) {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

async function analyzeFile(filePath) {
    const content = await readFile(filePath);
    if (!content) return null;

    const analysis = {
        mysql: {
            found: false,
            lines: []
        },
        json: {
            found: false,
            lines: []
        }
    };

    // Split content into lines and analyze each line
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Check for MySQL usage
        if (line.includes('mysql') || 
            line.includes('createConnection') || 
            line.includes('createPool') ||
            line.includes('execute(') ||
            line.includes('query(')) {
            analysis.mysql.found = true;
            analysis.mysql.lines.push(index + 1);
        }

        // Check for JSON file usage
        if (line.includes('.json') || 
            line.includes('readFile') || 
            line.includes('writeFile') ||
            line.includes('JSON.parse') ||
            line.includes('JSON.stringify')) {
            analysis.json.found = true;
            analysis.json.lines.push(index + 1);
        }
    });

    return analysis;
}

async function main() {
    const files = {
        'shop.js': '/pages/shop.js',
        'auth.js': '/pages/auth.js',
        'admin/dashboard.js': '/pages/admin/dashboard.js',
        'dev/dashboard.js': '/pages/dev/dashboard.js'
    };

    console.log(chalk.blue.bold('\nDatabase Usage Analysis\n'));

    for (const [name, relativePath] of Object.entries(files)) {
        const filePath = path.join(process.cwd(), relativePath);
        console.log(chalk.yellow(`\nAnalyzing ${name}:`));
        console.log(chalk.gray('----------------------------------------'));

        const analysis = await analyzeFile(filePath);
        if (!analysis) {
            console.log(chalk.red(`  ❌ Could not analyze file`));
            continue;
        }

        // Report MySQL usage
        if (analysis.mysql.found) {
            console.log(chalk.green(`  ✓ MySQL: Used`));
            console.log(chalk.gray(`    Lines: ${analysis.mysql.lines.join(', ')}`));
        } else {
            console.log(chalk.red(`  ✗ MySQL: Not used`));
        }

        // Report JSON usage
        if (analysis.json.found) {
            console.log(chalk.green(`  ✓ JSON: Used`));
            console.log(chalk.gray(`    Lines: ${analysis.json.lines.join(', ')}`));
        } else {
            console.log(chalk.red(`  ✗ JSON: Not used`));
        }

        // Provide recommendations
        console.log(chalk.cyan('\n  Recommendations:'));
        if (analysis.mysql.found && analysis.json.found) {
            console.log(chalk.yellow('  ⚠️  File uses both MySQL and JSON - Consider consolidating to MySQL only'));
        } else if (!analysis.mysql.found && analysis.json.found) {
            console.log(chalk.yellow('  ⚠️  File only uses JSON - Consider migrating to MySQL'));
        } else if (analysis.mysql.found && !analysis.json.found) {
            console.log(chalk.green('  ✓ File properly uses MySQL'));
        }
    }
}

// Run the analysis
main().catch(console.error); 