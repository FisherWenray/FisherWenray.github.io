(function() {
    const LIGHT_THEME_ICON = 'fas fa-circle-half-stroke';
    const DARK_THEME_ICON = 'fas fa-moon';

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    window.toggleTheme = function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon();
    };

    function updateToggleIcon() {
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            icon.className = currentTheme === 'dark' ? LIGHT_THEME_ICON : DARK_THEME_ICON;
        }
    }

    document.addEventListener('DOMContentLoaded', updateToggleIcon);
})();
