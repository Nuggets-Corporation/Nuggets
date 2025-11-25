document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('search');
    const URL = document.getElementById('url');

    search.addEventListener('submit', (event) => {
        event.preventDefault();

        const query = URL.value.trim();

        if (query) {
            const encodedQuery = encodeURIComponent(query);
            const newUrl = `/search?q=${encodedQuery}`;
            window.location.href = newUrl;
        }
    });
});