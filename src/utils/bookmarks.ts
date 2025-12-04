interface Bookmark {
    id: string;
    title: string;
    url: string;
    favicon: string;
}

const STORAGE_KEY = 'browser_bookmarks';

export function getBookmarks(): Bookmark[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to load bookmarks:', e);
        return [];
    }
}

export function saveBookmarks(bookmarks: Bookmark[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
        console.error('Failed to save bookmarks:', e);
    }
}

export function bookmarkItem(title: string, url: string, favicon: string): Bookmark {
    const bookmarks = getBookmarks();
    const bookmark: Bookmark = {
        id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title || 'Untitled',
        url,
        favicon
    };
    
    bookmarks.push(bookmark);
    saveBookmarks(bookmarks);
    return bookmark;
}

export function delBookmark(id: string): void {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== id);
    saveBookmarks(filtered);
}

export function isBookmark(url: string): boolean {
    const bookmarks = getBookmarks();
    return bookmarks.some(b => b.url === url);
}

export function loadBookmarks(container: HTMLElement, replacement: string): void {
    const bookmarks = getBookmarks();
    container.innerHTML = '';
    
    if (bookmarks.length === 0) {
        return;
    }
    
    bookmarks.forEach(bookmark => {
        const bookmarkEl = document.createElement('div');
        bookmarkEl.className = 'bookmark';
        bookmarkEl.setAttribute('data-bookmark-id', bookmark.id);
        bookmarkEl.innerHTML = `
            <img class="favicon" src="${bookmark.favicon}" onerror="this.src='${replacement}/assets/svg/favicon.svg'">
            <span class="bookmark-title" title="${bookmark.url}">${bookmark.title}</span>
            <button class="bookmark-delete" title="Remove bookmark">×</button>
        `;
        
        const titleEl = bookmarkEl.querySelector('.bookmark-title');
        titleEl?.addEventListener('click', () => {
            openBookmark(bookmark.url);
        });
        
        const deleteBtn = bookmarkEl.querySelector('.bookmark-delete');
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            delBookmark(bookmark.id);
            loadBookmarks(container, replacement);
        });
        
        container.appendChild(bookmarkEl);
    });
}

export function openBookmark(url: string): void {
    const event = new CustomEvent('open-bookmark', { detail: { url } });
    window.dispatchEvent(event);
}

export function tabInfo(): { title: string; url: string; favicon: string } | null {
    const activeTab = document.querySelector('#tab.active') as HTMLElement;
    const activeIframe = document.querySelector('.tab-iframe.active') as HTMLIFrameElement;
    
    if (!activeTab || !activeIframe) return null;
    
    const url = activeTab.getAttribute('data-url') || '';
    const titleEl = activeTab.querySelector('#title') as HTMLElement;
    const faviconEl = activeTab.querySelector('#favicon') as HTMLImageElement;
    
    if (!url) return null;
    
    return {
        title: titleEl?.textContent || 'Untitled',
        url,
        favicon: faviconEl?.src || ''
    };
}

export function bookmarkToggle(): void {
    const pageInfo = tabInfo();
    if (!pageInfo) return;
    
    if (isBookmark(pageInfo.url)) {
        const bookmarks = getBookmarks();
        const bookmark = bookmarks.find(b => b.url === pageInfo.url);
        if (bookmark) {
            delBookmark(bookmark.id);
        }
    } else {
        bookmarkItem(pageInfo.title, pageInfo.url, pageInfo.favicon);
    }
    
    updateBookmark();
    
    const bookmarksContainer = document.getElementById('bookmarks');
    const replacement = (window as any).replacement || '';
    if (bookmarksContainer) {
        loadBookmarks(bookmarksContainer, replacement);
    }
}

export function updateBookmark(): void {
    const addbookmark = document.getElementById('bookmark-btn');
    if (!addbookmark) return;
    
    const pageInfo = tabInfo();
    if (!pageInfo) return;
    
    if (isBookmark(pageInfo.url)) {
        addbookmark.classList.add('bookmarked');
        addbookmark.setAttribute('title', 'Remove bookmark');
    } else {
        addbookmark.classList.remove('bookmarked');
        addbookmark.setAttribute('title', 'Add bookmark');
    }
}

export function bookmarks(replacement: string): void {
    const bookmarksContainer = document.getElementById('bookmarks');
    if (bookmarksContainer) {
        loadBookmarks(bookmarksContainer, replacement);
    }
    
    window.addEventListener('open-bookmark', ((e: CustomEvent) => {
        const url = e.detail.url;
        const urlInput = document.getElementById('url') as HTMLInputElement;
        const searchForm = document.getElementById('search') as HTMLFormElement;
        
        if (urlInput && searchForm) {
            urlInput.value = url;
            searchForm.dispatchEvent(new Event('submit'));
        }
    }) as EventListener);
}