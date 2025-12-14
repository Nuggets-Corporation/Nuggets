export function getTabSrc(replacement: string): string {
    return `<div class="info">
            <img class="favicon" id="favicon" src="${replacement}/assets/svg/favicon.svg">
            <p id="title">New Tab</p>
        </div>
        <p class="bookmark-delete" id="close">×</p>`;
}

export function newTab(tabs: HTMLElement, newtab: HTMLElement, content: HTMLElement, replacement: string): void {

    const newTab = document.createElement('div');
    const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    newTab.id = 'tab';
    newTab.setAttribute('data-tab-id', tabId);
    newTab.innerHTML = getTabSrc(replacement);
    newTab.classList.add('hiddentab');
    newTab.setAttribute('data-replacement', replacement);
    newTab.setAttribute('data-url', '');
    tabs.insertBefore(newTab, newtab);

    const newIframe = document.createElement('iframe');
    newIframe.id = 'iframe';
    newIframe.setAttribute('data-tab-id', tabId);
    newIframe.classList.add('tab-iframe');
    content.appendChild(newIframe);

    const allTabs = tabs.querySelectorAll('#tab');
    const allIframes = content.querySelectorAll('.tab-iframe');

    allTabs.forEach(tab => tab.classList.remove('active'));
    allIframes.forEach(iframe => iframe.classList.remove('active'));

    newTab.classList.add('active');
    newIframe.classList.add('active');

    updateAddress(newTab);
    setupIframe(tabId, replacement);

    const closeButton = newTab.querySelector('#close');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(newTab, tabs, newtab);
        });
    }

    newTab.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).id === 'close') return;
        changeTab(newTab, content);
    });

    draggability(newTab, tabs, newtab);

    requestAnimationFrame(() => {
        newTab.classList.remove('hiddentab');
    });
}

export function changeTab(tab: HTMLElement, content: HTMLElement): void {
    const tabId = tab.getAttribute('data-tab-id');
    if (!tabId) return;

    const allTabs = document.querySelectorAll('#tab');
    const allIframes = content.querySelectorAll('.tab-iframe');

    allTabs.forEach(t => t.classList.remove('active'));
    allIframes.forEach(iframe => iframe.classList.remove('active'));

    tab.classList.add('active');
    const correspondingIframe = content.querySelector(`.tab-iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
    if (correspondingIframe) {
        correspondingIframe.classList.add('active');
    }

    updateAddress(tab);
    
    import('./proxy').then(({ updateNav }) => {
        updateNav();
    });
}

export function closeTab(tab: HTMLElement, tabs: HTMLElement, newtab: HTMLElement): void {
    const tabId = tab.getAttribute('data-tab-id');
    const content = document.getElementById('content');
    const wasActive = tab.classList.contains('active');

    tab.classList.add('hiddentab');

    if (content && tabId) {
        const correspondingIframe = content.querySelector(`.tab-iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
        if (correspondingIframe) {
            const intervalId = correspondingIframe.getAttribute('data-monitor-interval');
            if (intervalId) {
                clearInterval(parseInt(intervalId));
            }
            import('./proxy').then(({ cleanIframe }) => {
                cleanIframe(correspondingIframe);
            });
            correspondingIframe.remove();
        }
    }

    setTimeout(() => {
        tab.remove();
        const remainingTabs = Array.from(tabs.querySelectorAll('#tab:not(.hiddentab)')) as HTMLElement[];
        if (remainingTabs.length === 0) {
            const replacement = tab.getAttribute('data-replacement') || '';
            newTab(tabs, newtab, content, replacement);
        } else if (wasActive && remainingTabs.length > 0) {
            const lastTab = remainingTabs[remainingTabs.length - 1];
            if (content) {
                changeTab(lastTab, content);
            }
        }
    }, 200);
}

export function updateUrl(tabId: string, url: string, replacement: string): void {
    const tab = document.querySelector(`#tab[data-tab-id="${tabId}"]`) as HTMLElement;
    if (tab) {
        tab.setAttribute('data-url', url);

        if (tab.classList.contains('active')) {
            updateAddress(tab);
        }

        updateMeta(tabId, replacement);
    }
}

function setTitle(titleElement: HTMLElement | null, address: string) {
    if (!titleElement) return;
    
    const domain = getDomain(address);
    if (domain) {
        const parts = domain.replace('www.', '').split('.');
        const name = parts.length > 1 ? parts[parts.length - 2] : parts[0];
        titleElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    } else {
        titleElement.textContent = 'Untitled';
    }
}

export async function updateMeta(tabId: string, replacement: string): Promise<void> {
    const tab = document.querySelector(`#tab[data-tab-id="${tabId}"]`) as HTMLElement;
    const iframe = document.querySelector(`.tab-iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;

    if (!tab || !iframe) return;

    const titleElement = tab.querySelector('#title') as HTMLElement;
    const faviconElement = tab.querySelector('#favicon') as HTMLImageElement;
    
    const address = tab.getAttribute('data-url');
    
    if (!address || address === '') {
        if (titleElement) titleElement.textContent = 'New Tab';
        if (faviconElement) faviconElement.src = `${replacement}/assets/svg/favicon.svg`;
        return;
    }

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const title = iframeDoc?.title?.trim();
        
        if (titleElement) {
            if (title) {
                titleElement.textContent = title.length > 30 ? title.substring(0, 27) + '...' : title;
            } else if (iframe.src === 'about:blank' || !iframe.src) {
                titleElement.textContent = 'New Tab';
            } else {
                setTitle(titleElement, address);
            }
        }
    } catch (e) {
        setTitle(titleElement, address);
    }

    if (faviconElement) {
        try {
            const faviconUrl = await getFavicon(address);
            if (faviconUrl) {
                faviconElement.src = faviconUrl;
            } else {
                faviconElement.src = `${replacement}/assets/imgs/favicon.png`;
            }
        } catch (e) {
            faviconElement.src = `${replacement}/assets/imgs/favicon.png`;
        }
    }
}

function getDomain(url: string): string | null {
    try {
        if (!url || typeof url !== "string") return null;
        if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;

        return new URL(url).hostname;
    } catch (e) {
        return null;
    }
}

const cache = new Map<string, string>();

async function getFavicon(url: string): Promise<string | null> {
    const domain = getDomain(url);
    if (!domain) return `${replacement}/assets/imgs/favicon.png`;

    if (cache.has(domain)) {
        return cache.get(domain) || null;
    }

    const favicons = [
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        `https://${domain}/favicon.ico`
    ];

    const promises = favicons.map(faviconUrl => 
        new Promise<string>((resolve, reject) => {
            const img = new Image();
            const timeout = setTimeout(() => reject(new Error('timeout')), 2000);
            
            img.onload = () => {clearTimeout(timeout); resolve(faviconUrl)};
            img.onerror = () => {clearTimeout(timeout); reject(new Error('failed'))};
            img.src = faviconUrl;
        })
    );

    try {
        const faviconUrl = await Promise.any(promises);
        cache.set(domain, faviconUrl);
        return faviconUrl;
    } catch (e) {
        cache.set(domain, `${replacement}/assets/imgs/favicon.png`);
        return `${replacement}/assets/imgs/favicon.png`;
    }
}

export function setupIframe(tabId: string, replacement: string): void {
    const iframe = document.querySelector(`.tab-iframe[data-tab-id="${tabId}"]`) as HTMLIFrameElement;
    if (!iframe) return;

    iframe.addEventListener('load', () => {
        setTimeout(() => {
            updateMeta(tabId, replacement);
        }, 100);
    });

    const checkInterval = setInterval(() => {
        const tab = document.querySelector(`#tab[data-tab-id="${tabId}"]`);
        if (!tab) {
            clearInterval(checkInterval);
            return;
        }

        updateMeta(tabId, replacement);
    }, 1000);

    iframe.setAttribute('data-monitor-interval', checkInterval.toString());
}

export function updateAddress(tab: HTMLElement): void {
    const urlInput = document.getElementById('url') as HTMLInputElement;
    if (urlInput) {
        const storedUrl = tab.getAttribute('data-url') || '';
        urlInput.value = storedUrl;
    }
}

export function getActiveTab(): HTMLElement | null {
    return document.querySelector('#tab.active') as HTMLElement;
}

function draggability(tab: HTMLElement, tabs: HTMLElement, newtab: HTMLElement): void {
    tab.setAttribute('draggable', 'true');

    tab.addEventListener('dragstart', (e: DragEvent) => {
        if ((e.target as HTMLElement).id === 'close') {
            e.preventDefault();
            return;
        }

        tab.classList.add('dragging');

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', tab.innerHTML);
        }
    });

    tab.addEventListener('dragend', () => {
        tab.classList.remove('dragging');
    });

    if (!tabs.hasAttribute('data-drag-initialized')) {
        tabs.setAttribute('data-drag-initialized', 'true');

        tabs.addEventListener('dragover', (e: DragEvent) => {
            e.preventDefault();
            const draggingTab = tabs.querySelector('#tab.dragging') as HTMLElement;
            if (!draggingTab) return;

            const afterElement = getDrag(tabs, e.clientX, newtab);

            if (afterElement === null) {
                tabs.insertBefore(draggingTab, newtab);
            } else {
                tabs.insertBefore(draggingTab, afterElement);
            }
        });
    }
}

function getDrag(container: HTMLElement, x: number, newtab: HTMLElement): HTMLElement | null {
    const draggableElements = [...container.querySelectorAll('#tab:not(.dragging)')].filter(
        el => el !== newtab
    ) as HTMLElement[];

    return draggableElements.reduce<{ offset: number; element: HTMLElement | null }>(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY, element: null }
    ).element;
}