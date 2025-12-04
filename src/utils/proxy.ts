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

interface NavigationHistory {
    history: string[];
    currentIndex: number;
}

const navigationHistories = new Map<string, NavigationHistory>();

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
        iframeSrc.write(loadingSrc);
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
                navigator.serviceWorker.register(`/sw.js?r=${encodeURIComponent(replacement)}`);
            else
                navigator.serviceWorker.register(`/sw.js`);
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

function decodeProxyUrl(proxyUrl: string, config: ProxyConfig): string {
    try {        
        if (config.proxy === 'scramjet') {
            const prefix = '/~/s/';            
            if (proxyUrl.includes(prefix)) {
                const prefixIndex = proxyUrl.indexOf(prefix);
                const encoded = proxyUrl.substring(prefixIndex + prefix.length);                
                const decoded = decodeURIComponent(encoded);
                return decoded;
            }
        } else {
            const prefix = window.__uv$config.prefix;
            if (proxyUrl.includes(prefix)) {
                const encoded = proxyUrl.split(prefix)[1];
                return window.__uv$config.decodeUrl(encoded);
            }
        }
    } catch (e) {
    }
    return proxyUrl;
}

function initHistory(tabId: string): void {
    if (!navigationHistories.has(tabId)) {
        navigationHistories.set(tabId, {
            history: [],
            currentIndex: -1
        });
    }
}

function addHistory(tabId: string, url: string): void {
    initHistory(tabId);
    const nav = navigationHistories.get(tabId)!;
    
    if (nav.currentIndex < nav.history.length - 1) {
        nav.history = nav.history.slice(0, nav.currentIndex + 1);
    }
    
    if (nav.history[nav.currentIndex] !== url) {
        nav.history.push(url);
        nav.currentIndex++;
    }
    
    updateNavButtons(tabId);
}

function updateNavButtons(tabId: string): void {
    const nav = navigationHistories.get(tabId);
    if (!nav) return;
    
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');
    
    const activeTab = document.querySelector('#tab.active');
    if (!activeTab || activeTab.getAttribute('data-tab-id') !== tabId) return;
    
    if (backBtn) {
        if (nav.currentIndex > 0) {
            backBtn.classList.remove('disabled');
        } else {
            backBtn.classList.add('disabled');
        }
    }
    
    if (forwardBtn) {
        if (nav.currentIndex < nav.history.length - 1) {
            forwardBtn.classList.remove('disabled');
        } else {
            forwardBtn.classList.add('disabled');
        }
    }
}

export function goBack(config: ProxyConfig): void {
    const activeTab = document.querySelector('#tab.active') as HTMLElement;
    const activeIframe = document.querySelector('.tab-iframe.active') as HTMLIFrameElement;
    
    if (!activeTab || !activeIframe) return;
    
    const tabId = activeTab.getAttribute('data-tab-id');
    if (!tabId) return;
    
    const nav = navigationHistories.get(tabId);
    if (!nav || nav.currentIndex <= 0) return;
    
    nav.currentIndex--;
    const url = nav.history[nav.currentIndex];
    
    loadDirect(url, config, activeIframe, tabId, false);
    updateNavButtons(tabId);
}

export function goForward(config: ProxyConfig): void {
    const activeTab = document.querySelector('#tab.active') as HTMLElement;
    const activeIframe = document.querySelector('.tab-iframe.active') as HTMLIFrameElement;
    
    if (!activeTab || !activeIframe) return;
    
    const tabId = activeTab.getAttribute('data-tab-id');
    if (!tabId) return;
    
    const nav = navigationHistories.get(tabId);
    if (!nav || nav.currentIndex >= nav.history.length - 1) return;
    
    nav.currentIndex++;
    const url = nav.history[nav.currentIndex];
    
    loadDirect(url, config, activeIframe, tabId, false);
    updateNavButtons(tabId);
}

export function reload(): void {
    const activeIframe = document.querySelector('.tab-iframe.active') as HTMLIFrameElement;
    if (activeIframe) {
        activeIframe.src = activeIframe.src;
    }
}

function applyTheme(theme: string, replacement: string): void {
    const id = 'theme';
    let link = document.getElementById(id) as HTMLLinkElement;
    const href = `${replacement}/assets/css/themes/${theme}.css`;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.id = id;
        document.head.appendChild(link);
    }
    link.href = href;
}

function synaptic(url: string, replacement: string): void {
    const addr = new URL(url);
    const hostname = addr.hostname.toLowerCase();
    
    if (hostname === 'synaptic.site' || hostname.endsWith('.synaptic.site')) {
        const theme = localStorage.getItem('theme');
        if (theme !== 'synaptic') {
            localStorage.setItem('theme', 'synaptic');
            applyTheme('synaptic', replacement);
        }
    }
}

function loadDirect(
    decodedUrl: string,
    config: ProxyConfig,
    iframe: HTMLIFrameElement,
    tabId: string,
    addHistoryFlag: boolean = true
): void {
    let url: string;

    if (config.proxy === 'scramjet') {
        url = config.scramjet.encodeUrl(decodedUrl);
    } else {
        url = window.__uv$config.prefix + window.__uv$config.encodeUrl(decodedUrl);
    }

    iframe.src = url;
    
    const urlInput = document.getElementById('url') as HTMLInputElement;
    if (urlInput) {
        urlInput.value = decodedUrl;
    }
    synaptic(decodedUrl, config.replacement);
    import('../utils/tabs').then(({ updateUrl }) => {
        updateUrl(tabId, decodedUrl, config.replacement);
    });
    
    if (addHistoryFlag) {
        addHistory(tabId, decodedUrl);
    }
    
    setTimeout(() => {
        import('../utils/bookmarks').then(({ updateBookmark }) => {
            updateBookmark();
        });
    }, 500);
}

export function loadUrl(
    input: string,
    config: ProxyConfig,
    iframe: HTMLIFrameElement,
    urlInput: HTMLInputElement
): void {
    const newUrl = searchUrl(input);
    const tabId = iframe.getAttribute('data-tab-id');
    
    if (!tabId) return;
    
    loadDirect(newUrl, config, iframe, tabId, true);
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

export function setupIframe(
    iframe: HTMLIFrameElement,
    config: ProxyConfig,
    replacement: string
): void {
    const tabId = iframe.getAttribute('data-tab-id');
    if (!tabId) return;
    
    initHistory(tabId);
    
    iframe.addEventListener('load', () => {
        interceptor(iframe, config);
    });
    
    let lastUrl = '';
    const monitorInterval = setInterval(() => {
        try {
            if (!document.body.contains(iframe)) {
                clearInterval(monitorInterval);
                navigationHistories.delete(tabId);
                return;
            }
            
            const currentProxyUrl = iframe.contentWindow?.location.href;
            if (!currentProxyUrl || currentProxyUrl === 'about:blank') return;
            
            if (currentProxyUrl !== lastUrl) {
                lastUrl = currentProxyUrl;
                
                const decodedUrl = decodeProxyUrl(currentProxyUrl, config);
                synaptic(decodedUrl, replacement);
                const urlInput = document.getElementById('url') as HTMLInputElement;
                const activeIframe = document.querySelector('.tab-iframe.active');
                
                if (urlInput && activeIframe === iframe) {
                    urlInput.value = decodedUrl;
                }
                
                import('../utils/tabs').then(({ updateUrl }) => {
                    updateUrl(tabId, decodedUrl, replacement);
                });
                
                addHistory(tabId, decodedUrl);
                
                setTimeout(() => {
                    import('../utils/bookmarks').then(({ updateBookmark }) => {
                        updateBookmark();
                    });
                }, 100);
                
                interceptor(iframe, config);
            }
        } catch (e) {
                }
    }, 500);
    
    iframe.setAttribute('data-navigation-monitor', monitorInterval.toString());
}

export function cleanIframe(iframe: HTMLIFrameElement): void {
    const monitorId = iframe.getAttribute('data-navigation-monitor');
    if (monitorId) {
        clearInterval(parseInt(monitorId));
    }
    
    const tabId = iframe.getAttribute('data-tab-id');
    if (tabId) {
        navigationHistories.delete(tabId);
    }
}

export function updateNav(): void {
    const activeTab = document.querySelector('#tab.active') as HTMLElement;
    if (!activeTab) return;
    
    const tabId = activeTab.getAttribute('data-tab-id');
    if (tabId) {
        updateNavButtons(tabId);
    }
}

function interceptor(iframe: HTMLIFrameElement, config: ProxyConfig): void {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;
    if (iframeDoc.body?.hasAttribute('data-link-interceptor-injected')) return;
    setTimeout(() => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc || !doc.body) return;
            doc.body.setAttribute('data-link-interceptor-injected', 'true');
            doc.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a') as HTMLAnchorElement;
            
            if (!link || !link.href) return;
                const isNewTab = link.target === '_blank' || 
                e.ctrlKey || 
                e.metaKey || 
                e.button === 1;
            
            if (isNewTab) {
                e.preventDefault();
                e.stopPropagation();
                
                let url = link.href;
                url = decodeProxyUrl(url, config);
                window.parent.postMessage({
                    type: 'open-new-tab',
                    url: url
                }, '*');
            }
        }, true);
        
        const originalOpen = doc.defaultView?.open;
        if (originalOpen && doc.defaultView) {
            doc.defaultView.open = function(...args: any[]) {
                const url = args[0];
                if (url) {
                    const decodedUrl = decodeProxyUrl(url, config);
                    window.parent.postMessage({
                        type: 'open-new-tab',
                        url: decodedUrl
                    }, '*');
                    return null as any;
                }
                return originalOpen.apply(this, args);
            };
        }
    }, 100);
}