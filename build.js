import { execSync } from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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