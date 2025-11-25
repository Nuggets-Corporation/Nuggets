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
if (staticBuild) replacement=JSON.stringify('https://cdn.jsdelivr/npm/@nuggetscorporation/dist');
else replacement=JSON.stringify('');
export default defineConfig({
    output: output,
    adapter: staticBuild ? undefined : node({mode: "middleware"}),
    vite: {
        define: { 'import.meta.env.replacement': replacement },
        plugins: [viteStaticCopy({targets:[
            {src: `${scramjetPath}/**/*`.replace(/\\/g, "/"), dest: "sj"},
            {src: `${uvPath}/**/*`.replace(/\\/g, "/"), dest: "uv"},
            {src: `${epoxyPath}/**/*`.replace(/\\/g, "/"), dest: "epoxy"},
            {src: `${libcurlPath}/**/*`.replace(/\\/g, "/"), dest: "libcurl"},
            {src: `${baremuxPath}/**/*`.replace(/\\/g, "/"), dest: "baremux"},
        ]})],
        server: {
            proxy: {
                "/wisp/": { target: `ws://localhost:8040/wisp/`, changeOrigin: true, ws: true, rewrite: (path) => path.replace(/^\/wisp\//, "") }
            }
        }
    },
});