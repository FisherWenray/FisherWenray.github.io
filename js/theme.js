(function() {
    const LIGHT_THEME_ICON = 'theme-icon theme-icon-sun';
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

    function renderSiteFooter() {
        const footer = document.querySelector('.footer');
        if (!footer) return;

        footer.classList.add('site-footer');
        footer.innerHTML = `
            <div class="footer-main">
                <div class="footer-brand">
                    <a class="footer-name" href="/index.html">文鳐夜飞</a>
                    <p>一个有着嬉皮精神的 geek</p>
                </div>
                <nav class="footer-nav" aria-label="页脚导航">
                    <div class="footer-nav-group footer-nav-group--site">
                        <span>站内导航</span>
                        <div class="footer-link-grid">
                            <a href="/software.html">产品</a>
                            <a href="/business.html">服务</a>
                            <a href="/articles.html">Blog</a>
                            <a href="/books.html">书籍</a>
                            <a href="/podcast.html">播客</a>
                            <a href="/video.html">视频</a>
                            <a href="/music.html">音乐</a>
                        </div>
                    </div>
                    <div class="footer-nav-group footer-nav-group--social">
                        <span>找到我</span>
                        <div class="footer-social-links">
                            <a href="/about.html">关于</a>
                            <a href="https://github.com/FisherWenray" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>
                            <a href="https://x.com/wenyaoyefei" target="_blank" rel="noopener">X <span aria-hidden="true">↗</span></a>
                        </div>
                    </div>
                </nav>
            </div>
        `;
    }

    document.addEventListener('DOMContentLoaded', function() {
        updateToggleIcon();
        renderSiteFooter();
    });

    window.toggleMobileMenu = function() {
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('active');
        }
    };
})();
