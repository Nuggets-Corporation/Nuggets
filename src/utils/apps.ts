interface App {url: string; image: string; name: string;}
interface AppOrder {card: HTMLElement; index: number;}

export function filterApps(searchApps: HTMLInputElement, sortApps: HTMLSelectElement, apps: HTMLElement, app: HTMLElement[], order: AppOrder[]): void {
    const query = searchApps.value.toLowerCase();
    const sort = sortApps.value;

    let visible = app.filter(card => {
        const name = card.getAttribute('data-name') || '';
        const matches = name.includes(query);
        card.classList.toggle('hiddenapp', !matches);
        return matches;
    });

    if (sort === 'alphabetical') {
        visible.sort((a, b) => {
            const name1 = a.getAttribute('data-name') || '';
            const name2 = b.getAttribute('data-name') || '';
            return name1.localeCompare(name2);
        });
    } else if (sort === 'recent') {
        visible.sort((a, b) => {
            const index1 = order.find(item => item.card === a)?.index || 0;
            const index2 = order.find(item => item.card === b)?.index || 0;
            return index2 - index1;
        });
    }

    visible.forEach(card => apps.appendChild(card));
}

export function orderApps(app: HTMLElement[]): AppOrder[] {
    return app.map((card, index) => ({ card, index }));
}

export function loadApps(apps: App[], appsContainer: HTMLElement, replacement: string): HTMLElement[] {
    const appElements: HTMLElement[] = [];
    const fragment = document.createDocumentFragment();

    apps.forEach((app) => {
        const url = document.createElement('a');
        url.href = `/search?q=${encodeURIComponent(btoa(app.url))}`;
        url.className = 'app';
        url.setAttribute('data-name', app.name.toLowerCase());

        const image = document.createElement('img');
        image.className = 'image';
        if (app.image.startsWith('http'))
            image.src = app.image;
        else
            image.src = replacement + app.image;
        image.alt = app.name;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = app.name;

        url.appendChild(image);
        url.appendChild(name);
        
        fragment.appendChild(url);
        appElements.push(url);
    });

    appsContainer.appendChild(fragment);
    return appElements;
}