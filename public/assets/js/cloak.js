export function handleCloak() {
    if (window.self === window.top) Cloak(window.location);
    window.close();
}

function Cloak(src) {
    const tab = window.open('about:blank', '_blank')
    if (!tab) return;
    tab.document.title = document.title;
    const favicon = tab.document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.href = window.location.origin + "/assets/svg/favicon.svg";
    tab.document.head.appendChild(favicon);
    const style=`border: none; outline: none; width: 100vw; height: 100vh; position: fixed; left: 0; right: 0; top: 0; bottom: 0;`;
    tab.document.body.style.margin = '0';
    tab.document.body.innerHTML = `<iframe src="${src}" style="${style}"></iframe>`;
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('cloak');
    if (window.self != window.top) button.remove();
    button.addEventListener('click', () => {
        handleCloak();
    });
});