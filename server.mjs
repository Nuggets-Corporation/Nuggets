import express from 'express';
import chalk from 'chalk';
import os from 'os';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { splashtext, splashcolor } from "./splash.js";

const server=express();
const port = process.env.PORT || '8050';
const wisp = 8040;

let handle;
try {
    const entry = await import('./dist/server/entry.mjs');
    handle = entry.handler;
} catch (e) {
    console.error("Please run `pnpm run build:server`.")
    process.exit(1);
}

const serve = serveStatic('./dist/client', { 'index': false });
const ssrHandler = handle;
const clientHandler = (req, res) => {
    serve(req, res, (err) => {
        if (err || res.headersSent) {
            finalhandler(req, res)(err);
            return;
        }
        ssrHandler(req, res);
    });
};

server.use('/wisp/',
    createProxyMiddleware({
        target: `ws://localhost:${wisp}`,
        changeOrigin: true,
        ws: true,
        pathRewrite: {'^/wisp/': ''},
    })
);

server.use(clientHandler);

server.listen(port, '0.0.0.0', () => {
	const splashc = chalk.hex(splashcolor);
	const theme = chalk.hex('#f88c00');
	const soap = chalk.hex('#ebaaee');
	const host = chalk.hex('#cc6700');
    const addr_color_idk_what_to_name_this = chalk.hex('#a8a8a8');
	console.log(chalk.bold(theme(`
d88b    88b                                     d8P          
d88q8b  88b                                 d8888888888P          
d888q8b 88b?88   d8P d888b8b   d888b8b   d8888b  ?88'   .d888b,
d88b q88b8b?88   88 d8P' ?88  d8P' ?88  d8b_,dP  88P    ?8b,   
d88    q88b?8(  d88 88b  ,88b 88b  ,88b 88b      88b      '?8b 
d88'    88b'?88P'?8b'?88P''88b'?88P''88b'?888P'  '?8b  '?888P' 
                          )88       )88                       
                         ,88P      ,88P                       
                     '?8888P   '?8888P                        
                    
	`)));
	console.log(chalk.bold(splashc(splashtext)))
	console.log(chalk.bold(`Made by:`));
	console.log(chalk.bold(`- ` + theme(`Synaptic`) + ` - Lead developer of Nuggets`));
	console.log(chalk.bold(`- ` + soap(`soap phia`) + ` - Lead developer of Nuggets\n`));

    console.log(chalk.bold(theme(`Server is running on:`)));
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(chalk.bold(addr_color_idk_what_to_name_this(`External:	http://${net.address}:${port}`)));
            }
            if (net.family === 'IPv4' && net.internal) {
                console.log(chalk.bold(addr_color_idk_what_to_name_this(`Internal:	http://localhost:${port}`)));
            }
        }
    }
});