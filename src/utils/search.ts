export function handleSearch(
    search: HTMLFormElement,
    urlInput: HTMLInputElement,
    event: Event
): void {
    event.preventDefault();

    const query = urlInput.value.trim();

    if (query) {
        const encodedQuery = encodeURIComponent(query);
        const newUrl = `/search?q=${btoa(encodedQuery)}`;
        window.location.href = newUrl;
    }
}