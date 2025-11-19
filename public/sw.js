if (navigator.userAgent.includes("Firefox")) {
  Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: true,
    writable: true
  });
}

importScripts("/sj/scramjet.all.js");
importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts("/workerware.js");
importScripts(__uv$config.sw);

const { ScramjetServiceWorker } = $scramjetLoadWorker();

const scramjet = new ScramjetServiceWorker();
const ultraviolet = new UVServiceWorker();
const workerware = new WorkerWare({ debug: false });

(async function () { await scramjet.loadConfig() })();

self.addEventListener("fetch", function (event) {
  event.respondWith((async () => {
    const workerwareRun = await workerware.run(event)();
    if (workerwareRun.includes(null)) {
        return;
    }
    if (event.request.url.startsWith(location.origin + __uv$config.prefix)) {
        return await ultraviolet.fetch(event);
    } else if (scramjet.route(event)) {
        return await scramjet.fetch(event);
    } else {
        return await fetch(event.request);
    }
  })());
});
