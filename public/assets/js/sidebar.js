export function hideSidebar(sidebar, toggle) {
    sidebar.classList.add('hidden')
    toggle.classList.add('shown')
    sidebar.classList.remove('shown')
    toggle.classList.remove('hidden')
}

export function showSidebar(sidebar, toggle) {
    sidebar.classList.add('shown')
    toggle.classList.add('hidden')
    sidebar.classList.remove('hidden')
    toggle.classList.remove('shown')
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebartoggle');
    const hide = document.getElementById('sidebarhide');
    const show = document.getElementById('sidebarshow');
    hide.addEventListener('click', () => {
        hideSidebar(sidebar, toggle);
    });
    show.addEventListener('click', () => {
        showSidebar(sidebar, toggle);
    });
});