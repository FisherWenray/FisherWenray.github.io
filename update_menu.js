const fs = require('fs');

const files = [
    'index.html',
    'articles.html',
    'article.html',
    'software.html',
    'video.html',
    'podcast.html',
    'music.html',
    'books.html',
    'business.html',
    'scripts/generate-seo-articles.js'
];

const newCSS = `        /* --- Mobile Menu --- */
        .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            color: var(--ink);
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            margin-left: 10px;
        }
        @media (max-width: 680px) {
            .mobile-menu-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(var(--primary-rgb), 0.08);
                border: 1px solid var(--line);
                color: #c5b358;
                transition: all 0.3s ease;
            }
            [data-theme='dark'] .mobile-menu-btn {
                color: var(--gold);
                border-color: var(--line);
                background: rgba(255, 255, 255, 0.05);
            }
            .nav-links {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background: rgba(244, 246, 248, 0.95);
                backdrop-filter: blur(14px);
                flex-direction: column;
                padding: 10px 0;
                border-bottom: 1px solid var(--line);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            [data-theme='dark'] .nav-links {
                background: rgba(0, 8, 20, 0.95);
            }
            .nav-links.active {
                display: flex;
            }
            .nav-links a {
                width: 100%;
                border-radius: 0;
                padding: 15px 0;
            }
            .nav-container {
                position: relative;
            }
        }`;

for (const file of files) {
    try {
        let content = fs.readFileSync(file, 'utf8');

        // Replace CSS
        let cssRegex = /(?:\/\*\s*---\s*Mobile Menu\s*---\s*\*\/\s*)?\.mobile-menu-btn\s*\{[\s\S]*?(?=<\/style>)/;
        if (!cssRegex.test(content)) {
             // Fallback if no .mobile-menu-btn exists
             content = content.replace(/(?=<\/style>)/, newCSS + "\n    ");
        } else {
             content = content.replace(cssRegex, newCSS + "\n    ");
        }

        // Replace HTML
        let navRegex = /<nav class="top-nav">([\s\S]*?)<\/nav>/;
        let match = content.match(navRegex);
        if (match) {
            let navContent = match[1];
            // Extract the list items exactly as they are to preserve them
            let liRegex = /<ul class="nav-links"[^>]*>([\s\S]*?)<\/ul>/;
            let liMatch = navContent.match(liRegex);
            let liItems = liMatch ? liMatch[1] : '';
            // Trim if needed, but keeping whitespace usually works
            
            // Reconstruct nav replacing exactly what was asked
            let newNav = `<nav class="top-nav">
        <div class="nav-container">
            <ul class="nav-links" id="navLinks">${liItems}</ul>
            <div style="display: flex; align-items: center;">
                <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">
                    <i class="fas fa-moon"></i>
                </button>
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="菜单">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    </nav>`;
            
            content = content.replace(navRegex, newNav);
        } else {
            console.log(`Could not find <nav> to replace in ${file}`);
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    } catch (e) {
        console.error(`Error updating ${file}:`, e);
    }
}
