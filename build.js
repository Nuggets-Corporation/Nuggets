import { execSync } from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { promises as fs } from 'fs';
import path from 'path';

const argv = yargs(hideBin(process.argv)).options({
    'wisp': {
        alias: 'ca',
        type: 'string',
        description: 'Wisp URL',
    },
}).parse();

if (argv.wisp) {
    process.env.wispUrl = argv.wisp;
    console.log
} else {
    process.env.wispUrl = 'default';
    if (process.env.staticBuild === 'static') {
        process.env.wispUrl="nuggetscorporation.org/wisp/";
        console.warn("No Wisp URL specified with --wisp <url>! Defaulting to wss://nuggetscorporation.org/wisp/")
    };
}

const buildMode = process.env.staticBuild ? `--mode=${process.env.staticBuild}` : '';

try {
    execSync(`astro build ${buildMode}`, { stdio: 'inherit' });
} catch (e) {
    process.exit(1);
}

if (process.env.staticBuild === 'static') {
    const distDir = path.join(process.cwd(), 'dist');
    const findStr = '/https://';
    const replaceStr = 'https://';

    async function traverseDir(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await traverseDir(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.html'))) {
                await processFile(fullPath);
            }
        }
    }

    async function processFile(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            
            if (content.includes(findStr)) {
                const newContent = content.replaceAll(findStr, replaceStr);
                await fs.writeFile(filePath, newContent, 'utf-8');
            }
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
        }
    }

    traverseDir(distDir)
};