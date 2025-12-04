declare global {
    interface Window {
        replacement?: string;
        wispVal: string;
        routeQuery: string;
        $scramjetLoadController: () => any;
        BareMux: any;
        __uv$config: any;
    }
}

interface ProxyConfig {
    replacement: string;
    wispVal: string;
    scramjet: any;
    proxy: string;
}

export function getLoadingSrc(replacement: string): string {
    return `<head>
    <link rel="stylesheet" href="${replacement}/assets/css/loading.css">
</head>
<body class="load">
    <div class="loading"></div>
</body>`;
}

export function iframeLoading(iframe: HTMLIFrameElement, replacement: string): void {
    if (iframe && iframe.contentWindow) {
        const loadingSrc = getLoadingSrc(replacement);
        const iframeSrc = iframe.contentWindow.document;
        iframeSrc.open();
        iframeSrc.write();
        iframeSrc.close();
    }
}

export function init(replacement: string): any {
    const { ScramjetController } = window.$scramjetLoadController();

    const scramjet = new ScramjetController({
        prefix: "/~/s/",
        files: {
            wasm: `${replacement}/sj/scramjet.wasm.wasm`,
            all: `${replacement}/sj/scramjet.all.js`,
            sync: `${replacement}/sj/scramjet.sync.js`,
        },
    });

    try {
        if (navigator.serviceWorker) {
            scramjet.init();
            if (replacement)
                navigator.serviceWorker.register(`./sw.js?r=${replacement}`);
            else
                navigator.serviceWorker.register(`./sw.js`);
        } else {
            console.warn("Service workers not supported");
        }
    } catch (e) {
        console.error("Failed to initialize Scramjet:", e);
    }

    return scramjet;
}

export function getWisp(wispVal: string): string {
    if (wispVal === 'default' || wispVal === 'undefined') {
        return (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    } else {
        return 'wss://' + String(wispVal).replace(/^(https?|wss?):\/\//i, '');
    }
}

export async function setTransport(
    connection: any,
    transportsel: string,
    replacement: string,
    wispUrl: string
): Promise<void> {
    switch (transportsel) {
        case "epoxy":
            await connection.setTransport(`${replacement}/epoxy/index.mjs`, [{ wisp: wispUrl }]);
            break;
        case "libcurl":
            await connection.setTransport(`${replacement}/libcurl/index.mjs`, [{ websocket: wispUrl }]);
            break;
    }
}

export function searchUrl(input: string): string {
    let template = "https://www.google.com/search?q=%s";
    try {
        return new URL(input).toString();
    } catch (err) {}

    try {
        let url = new URL(`https://${input}`);
        if (url.hostname.includes(".")) return url.toString();
    } catch (err) {}

    return template.replace("%s", encodeURIComponent(input));
}

export function loadUrl(
    input: string,
    config: ProxyConfig,
    iframe: HTMLIFrameElement,
    urlInput: HTMLInputElement
): void {
    const newUrl = searchUrl(input);
    let url: string;

    if (config.proxy === 'scramjet') {
        url = config.scramjet.encodeUrl(newUrl);
    } else {
        url = window.__uv$config.prefix + window.__uv$config.encodeUrl(newUrl);
    }

    iframe.src = url;
    urlInput.value = decodeURIComponent(newUrl);
    
    const tabId = iframe.getAttribute('data-tab-id');
    if (tabId) {
        import('../utils/tabs').then(({ updateUrl }) => {
            updateUrl(tabId, decodeURIComponent(newUrl));
        });
    }
}

export function handleSubmit(
    event: Event,
    urlInput: HTMLInputElement,
    config: ProxyConfig,
    iframe: HTMLIFrameElement
): void {
    event.preventDefault();
    const newUrl = urlInput.value;
    loadUrl(newUrl, config, iframe, urlInput);
}