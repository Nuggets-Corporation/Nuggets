import node from "@astrojs/node";
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';
import { defineConfig } from "astro/config";
import { viteStaticCopy } from "vite-plugin-static-copy";


const staticBuild = process.env.staticBuild === "static";
const output = staticBuild ? "static" : "server";
let replacement;
import packagejson from './package.json';
if (staticBuild) replacement=JSON.stringify(`https://cdn.jsdelivr.net/npm/@nuggetscorporation/nuggets@${packagejson.version}/dist`);
else replacement=JSON.stringify('');
export default defineConfig({
    output: output,
    adapter: staticBuild ? undefined : node({mode: "middleware"}),
    base: staticBuild ? JSON.parse(replacement) : '/',
    build: {
        assets: "_astro",
    },
    vite: {
        define: { 'replacement': replacement },
        plugins: [viteStaticCopy({targets:[
            {src: `${scramjetPath}/**/*`.replace(/\\/g, "/"), dest: "sj"},
            {src: `${uvPath}/**/*`.replace(/\\/g, "/"), dest: "uv"},
            {src: `${epoxyPath}/**/*`.replace(/\\/g, "/"), dest: "epoxy"},
            {src: `${libcurlPath}/**/*`.replace(/\\/g, "/"), dest: "libcurl"},
            {src: `${baremuxPath}/**/*`.replace(/\\/g, "/"), dest: "baremux"},
            {src: `${baremuxPath}/worker.js`.replace(/\\/g, "/"), dest: ".", rename: "bareworker.js"},
        ]})],
        server: {
            proxy: {
                "/wisp/": { target: `ws://localhost:8040/wisp/`, changeOrigin: true, ws: true, rewrite: (path) => path.replace(/^\/wisp\//, "") }
            }
        }
    },
});