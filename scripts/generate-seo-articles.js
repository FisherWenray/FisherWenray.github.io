const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const articlesJsonPath = path.join(repoRoot, 'articles.json');
const outputDir = path.join(repoRoot, 'posts');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtmlTags(input) {
  return String(input).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTitleFromMarkdown(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m && m[1] ? m[1].trim() : '';
}

function extractDescriptionFromMarkdown(markdown) {
  const normalized = markdown.replace(/^---[\s\S]*?---\r?\n*/, '');
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('```') && !line.startsWith('>'));
  if (!lines.length) return '';
  const plain = lines
    .join(' ')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 140);
}

function parseMarkdown(markdown, basePath = '') {
  let html = markdown;

  html = html.replace(/^---[\s\S]*?---\r?\n*/, '');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\b__(.*?)__\b/g, '<strong>$1</strong>');
  html = html.replace(/\b_(.*?)_\b/g, '<em>$1</em>');

  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  html = html.replace(/`([^`]*)`/g, '<code>$1</code>');

  html = html.replace(/!\[([^\]]*)\]\(((?:[^()]+|\([^)]+\))*)\)/g, (match, alt, url) => {
    let finalUrl = url;
    if (basePath && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
      finalUrl = `${basePath}/${url}`;
    }
    const src = finalUrl.startsWith('data:') ? finalUrl : `../${finalUrl}`;
    const webpCandidates = [
      finalUrl.replace(/\.jpg\.opt\.jpe?g$/i, '.webp'),
      finalUrl.replace(/\.(?:jpe?g|png)$/i, '.webp')
    ].filter((candidate, index, list) => candidate !== finalUrl && list.indexOf(candidate) === index);
    const webpUrl = webpCandidates.find((candidate) => fs.existsSync(path.join(repoRoot, candidate)));
    if (!finalUrl.startsWith('data:') && webpUrl) {
      return `<picture>
<source srcset="../${webpUrl}" type="image/webp">
<img src="${src}" alt="${alt}" loading="lazy" decoding="async">
</picture>`;
    }
    return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
  });

  html = html.replace(/(^|[^!])\[([^\]]*)\]\(((?:[^()]+|\([^)]+\))*)\)/g, (match, prefix, text, url) => {
    const href = url.startsWith('http') ? url : `../${url}`;
    return `${prefix}<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
  });

  html = html.replace(/(^>.*(?:\r?\n>.*)*)/gm, (match) => {
    const content = match
      .split(/\r?\n/)
      .map((line) => line.replace(/^> ?/, ''))
      .join('<br>');
    return `<blockquote>${content}</blockquote>`;
  });

  html = html
    .split(/\r?\n\s*\r?\n/)
    .map((para) => {
      const block = para.trim();
      if (
        block &&
        !block.startsWith('<h') &&
        !block.startsWith('<pre') &&
        !block.startsWith('<ul') &&
        !block.startsWith('<ol') &&
        !block.startsWith('<blockquote') &&
        !block.startsWith('<img') &&
        !block.startsWith('<hr') &&
        !block.startsWith('<table') &&
        !block.startsWith('<a') &&
        !/^\s*[-*+]\s+/.test(block) &&
        !/^\s*\d+\.\s+/.test(block)
      ) {
        return `<p>${block.replace(/\r?\n/g, '<br>')}</p>`;
      }
      return block;
    })
    .join('\n');

  html = html.replace(/^---$/gm, '<hr>');

  html = html.replace(/((?:^\s*[-*+]\s+.*\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((line) => line.replace(/^\s*[-*+]\s+/, '').replace(/<br\s*\/?>/gi, '').trim());
    return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  });

  html = html.replace(/((?:^\s*\d+\.\s+.*\n?)+)/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((line) => line.replace(/^\s*\d+\.\s+/, '').replace(/<br\s*\/?>/gi, '').trim());
    return `<ol>${items.map((item) => `<li>${item}</li>`).join('')}</ol>`;
  });

  return html;
}

function articleTemplate(article, htmlContent) {
  const title = stripHtmlTags(article.title || '').trim() || `文章 ${article.id || ''}`.trim();
  const desc = (stripHtmlTags(article.description || '').trim() || title).replace(/\s+/g, ' ').trim();
  const date = article.date || '';
  const canonical = `https://wenyaoyefei.com/posts/${article.id}.html`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: desc,
    author: { '@type': 'Person', name: article.author || '文鳐夜飞' },
    datePublished: date || undefined,
    dateModified: date || undefined,
    mainEntityOfPage: canonical,
    inLanguage: 'zh-CN',
    publisher: { '@type': 'Person', name: '文鳐夜飞' }
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 文鳐夜飞</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta property="og:title" content="${escapeHtml(title)} - 文鳐夜飞">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://wenyaoyefei.com/avatar.jpg">
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script src="../js/theme.js?v=5" defer></script>
  <link rel="icon" type="image/jpeg" href="../avatar.jpg">
  <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;700&display=swap"
        media="print" onload="this.media='all'">
  <link rel="stylesheet" href="../css/site.css?v=2">
  <link rel="stylesheet" href="../css/article.css?v=1">
  <link rel="stylesheet" href="../css/elevated-design.css?v=21">
</head>
<body>
  <nav class="top-nav">
        <div class="nav-container">
            <ul class="nav-links" id="navLinks">
        <li><a href="../index.html">首页</a></li>
        <li><a href="../software.html">产品</a></li>
        <li><a href="../business.html">服务</a></li>
        <li><a href="../content.html" class="active">内容</a></li>
        <li><a href="../about.html">关于</a></li>      </ul>
            <div style="display: flex; align-items: center;">
                <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题">
                    <i class="fas fa-moon"></i>
                </button>
                <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="菜单">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    </nav>

  <main class="page">
    <div class="container">
      <div class="article-header">
        <h1 class="article-title">${escapeHtml(title)}</h1>
        <div class="article-meta">
          <span class="meta-item"><i class="far fa-user"></i>${escapeHtml(article.author || '文鳐夜飞')}</span>
          <span class="meta-item"><i class="far fa-calendar"></i>${escapeHtml(date)}</span>
          <span class="meta-item"><i class="fas fa-tag"></i>${escapeHtml(article.category || '')}</span>
        </div>
      </div>
      <div class="article-body">
        <div class="article-content">${htmlContent}</div>
      </div>
    </div>
  </main>

  <div class="footer"></div>

    <script>
        function toggleMobileMenu() {
            const navLinks = document.getElementById('navLinks');
            if (navLinks) {
                navLinks.classList.toggle('active');
            }
        }
    </script>
</body>
</html>`;
}

function generateSitemap(articles) {
  const domain = 'https://wenyaoyefei.com';
  const today = new Date().toISOString().split('T')[0];
  
  let urls = `  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/software.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/content.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/articles.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/media.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/business.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/video.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/podcast.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/music.html</loc>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${domain}/books.html</loc>
    <lastmod>${today}</lastmod>
  </url>\n`;

  for (let chapter = 1; chapter <= 6; chapter += 1) {
    urls += `  <url>
    <loc>${domain}/books/xingsi-wujie/chapter-${String(chapter).padStart(2, '0')}.html</loc>
    <lastmod>${today}</lastmod>
  </url>\n`;
  }

  for (const article of articles) {
    if (!article.id) continue;
    const loc = `${domain}/posts/${article.id}.html`;
    const lastmod = article.date || today;
    urls += `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>\n`;
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;

  fs.writeFileSync(path.join(repoRoot, 'sitemap.xml'), sitemapContent, 'utf8');
  console.log('Successfully generated sitemap.xml');
}

function main() {
  const raw = fs.readFileSync(articlesJsonPath, 'utf8');
  const data = JSON.parse(raw);
  const articles = Array.isArray(data.articles) ? data.articles : [];

  fs.mkdirSync(outputDir, { recursive: true });

  for (const article of articles) {
    if (!article.id || !article.markdown) continue;
    const mdPath = path.join(repoRoot, article.markdown);
    if (!fs.existsSync(mdPath)) continue;

    const md = fs.readFileSync(mdPath, 'utf8');
    const basePath = article.markdown.slice(0, article.markdown.lastIndexOf('/'));
    const markdownTitle = extractTitleFromMarkdown(md);
    const markdownDesc = extractDescriptionFromMarkdown(md);
    const safeArticle = {
      ...article,
      title: markdownTitle || article.title || `文章 ${article.id}`,
      description: markdownDesc || article.description || markdownTitle || `文章 ${article.id}`
    };

    const mdWithoutTopTitle = md.replace(/^#\s+.*\r?\n?/m, '');
    const htmlContent = parseMarkdown(mdWithoutTopTitle, basePath).replace(/<h1[^>]*>[\s\S]*?(<\/h1>|\/h1>)/gi, '');
    const out = articleTemplate(safeArticle, htmlContent);
    fs.writeFileSync(path.join(outputDir, `${article.id}.html`), out, 'utf8');
  }
  
  generateSitemap(articles);
}

main();
