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

function absoluteSiteUrl(value) {
  if (!value) return 'https://wenyaoyefei.com/avatar.jpg';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://wenyaoyefei.com/${String(value).replace(/^\/+/, '')}`;
}

function imageSizeAttributes(relativePath) {
  if (!relativePath || /^https?:\/\//i.test(relativePath) || relativePath.startsWith('data:')) return '';
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return ` width="${buffer.readUInt32BE(16)}" height="${buffer.readUInt32BE(20)}"`;
  }

  if (buffer.length >= 10 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return ` width="${buffer.readUInt16LE(6)}" height="${buffer.readUInt16LE(8)}"`;
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return ` width="${buffer.readUInt16BE(offset + 7)}" height="${buffer.readUInt16BE(offset + 5)}"`;
      }
      if (length < 2) break;
      offset += length + 2;
    }
  }

  return '';
}

function articleCoverMarkup(article, { eager = false } = {}) {
  if (!article.image || article.image === 'images/article-placeholder.svg') {
    return `<div class="article-image-wrap empty" aria-hidden="true"><div class="article-image"></div></div>`;
  }
  const width = Number(article.imageWidth) || 1200;
  const height = Number(article.imageHeight) || 675;
  const loading = eager ? 'eager' : 'lazy';
  const priority = eager ? ' fetchpriority="high"' : '';
  const source = article.imageSmall
    ? `<source srcset="${escapeHtml(article.imageSmall)} 704w, ${escapeHtml(article.image)} ${width}w" sizes="(max-width: 720px) calc(100vw - 60px), 360px" type="image/webp">`
    : '';
  const badge = eager ? '\n    <span class="article-badge">最新</span>' : '';
  return `<div class="article-image-wrap">${badge}
    <picture>${source}<img class="article-image" src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)}" width="${width}" height="${height}" loading="${loading}" decoding="async"${priority}></picture>
  </div>`;
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
    if (/^data:image\/svg\+xml/i.test(finalUrl) && /width(?:=|%3D)["']?1px/i.test(decodeURIComponent(finalUrl))) {
      return '';
    }
    const sizeAttrs = imageSizeAttributes(finalUrl);
    const webpCandidates = [
      finalUrl.replace(/\.jpg\.opt\.jpe?g$/i, '.webp'),
      finalUrl.replace(/\.(?:jpe?g|png)$/i, '.webp')
    ].filter((candidate, index, list) => candidate !== finalUrl && list.indexOf(candidate) === index);
    const webpUrl = webpCandidates.find((candidate) => fs.existsSync(path.join(repoRoot, candidate)));
    if (!finalUrl.startsWith('data:') && webpUrl) {
      return `<picture>
<source srcset="../${webpUrl}" type="image/webp">
<img src="${src}" alt="${escapeHtml(alt)}"${sizeAttrs} loading="lazy" decoding="async">
</picture>`;
    }
    return `<img src="${src}" alt="${escapeHtml(alt)}"${sizeAttrs} loading="lazy" decoding="async">`;
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

function articleTemplate(article, htmlContent, navigation = {}) {
  const title = stripHtmlTags(article.title || '').trim() || `文章 ${article.id || ''}`.trim();
  const desc = (stripHtmlTags(article.description || '').trim() || title).replace(/\s+/g, ' ').trim();
  const date = article.date || '';
  const modifiedDate = article.updated || date;
  const canonical = `https://wenyaoyefei.com/posts/${article.id}.html`;
  const imageUrl = absoluteSiteUrl(article.image);
  const authorName = article.author || '文鳐夜飞';
  const previous = navigation.previous;
  const next = navigation.next;
  const relLinks = [
    previous ? `<link rel="prev" href="https://wenyaoyefei.com/posts/${previous.id}.html">` : '',
    next ? `<link rel="next" href="https://wenyaoyefei.com/posts/${next.id}.html">` : ''
  ].filter(Boolean).join('\n  ');

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      headline: title,
      description: desc,
      image: [imageUrl],
      author: { '@type': 'Person', name: authorName, url: 'https://wenyaoyefei.com/about.html' },
      datePublished: date || undefined,
      dateModified: modifiedDate || undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      inLanguage: 'zh-CN',
      publisher: { '@type': 'Person', name: '文鳐夜飞', url: 'https://wenyaoyefei.com/' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: 'https://wenyaoyefei.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://wenyaoyefei.com/articles.html' },
        { '@type': 'ListItem', position: 3, name: title, item: canonical }
      ]
    }
  ];

  const articleNavigation = `<nav class="article-pagination" aria-label="文章导航">
        ${previous ? `<a class="article-pagination-link" rel="prev" href="${previous.id}.html"><span>上一篇</span><strong>${escapeHtml(previous.title)}</strong></a>` : '<a class="article-pagination-link" href="../articles.html"><span>返回</span><strong>全部文章</strong></a>'}
        ${next ? `<a class="article-pagination-link article-pagination-link-next" rel="next" href="${next.id}.html"><span>下一篇</span><strong>${escapeHtml(next.title)}</strong></a>` : '<a class="article-pagination-link article-pagination-link-next" href="../articles.html"><span>继续阅读</span><strong>浏览全部文章</strong></a>'}
      </nav>`;

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
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="${Number(article.imageWidth) || 1200}">
  <meta property="og:image:height" content="${Number(article.imageHeight) || 675}">
  <meta property="article:published_time" content="${escapeHtml(date)}">
  <meta property="article:modified_time" content="${escapeHtml(modifiedDate)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} - 文鳐夜飞">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${imageUrl}">
  <link rel="canonical" href="${canonical}">
  ${relLinks}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script src="../js/theme.js?v=5" defer></script>
  <link rel="icon" type="image/jpeg" href="../avatar.jpg">
  <link rel="stylesheet" href="../css/site.css?v=3">
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
      <nav class="article-breadcrumb" aria-label="面包屑导航">
        <a href="../index.html">首页</a><span aria-hidden="true">/</span><a href="../articles.html">Blog</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(title)}</span>
      </nav>
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
      ${articleNavigation}
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

function existingSitemapLastmods() {
  const sitemapPath = path.join(repoRoot, 'sitemap.xml');
  const result = new Map();
  if (!fs.existsSync(sitemapPath)) return result;
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
    result.set(match[1], match[2]);
  }
  return result;
}

function updateArticleIndex(articles) {
  const indexPath = path.join(repoRoot, 'articles.html');
  if (!fs.existsSync(indexPath)) return;
  const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  const cards = sorted.map((article, index) => `
                <a class="article-card" style="--card-index: ${index}" href="posts/${article.id}.html" data-article-id="${article.id}" onclick="trackArticleClick(event)">
                    ${articleCoverMarkup(article, { eager: index === 0 })}
                    <div class="article-content">
                        <span class="article-category">${escapeHtml(article.category || '')}</span>
                        <h2 class="article-title">${escapeHtml(article.title)}</h2>
                        <p class="article-description">${escapeHtml(article.description || '')}</p>
                        <div class="article-meta"><div class="article-date"><i class="far fa-calendar"></i><time datetime="${escapeHtml(article.date || '')}">${escapeHtml(article.date || '')}</time></div></div>
                    </div>
                </a>`).join('');
  const cardsBlock = `<!-- SEO_ARTICLE_CARDS_START -->${cards}\n            <!-- SEO_ARTICLE_CARDS_END -->`;
  const safeJson = JSON.stringify({ articles: sorted }).replace(/</g, '\\u003c');
  const dataBlock = `<script id="articlesData" type="application/json">${safeJson}</script>`;
  let html = fs.readFileSync(indexPath, 'utf8');

  if (/<!-- SEO_ARTICLE_CARDS_START -->[\s\S]*?<!-- SEO_ARTICLE_CARDS_END -->/.test(html)) {
    html = html.replace(/<!-- SEO_ARTICLE_CARDS_START -->[\s\S]*?<!-- SEO_ARTICLE_CARDS_END -->/, cardsBlock);
  } else {
    html = html.replace('<div class="articles-grid" id="articlesGrid"></div>', `<div class="articles-grid" id="articlesGrid">${cardsBlock}\n            </div>`);
  }

  if (/<script id="articlesData" type="application\/json">[\s\S]*?<\/script>/.test(html)) {
    html = html.replace(/<script id="articlesData" type="application\/json">[\s\S]*?<\/script>/, dataBlock);
  } else {
    html = html.replace('    <script src="js/umami-config.js"></script>', `    ${dataBlock}\n    <script src="js/umami-config.js"></script>`);
  }
  fs.writeFileSync(indexPath, html, 'utf8');
}

function generateSitemap(articles, { refreshStatic = false } = {}) {
  const domain = 'https://wenyaoyefei.com';
  const today = new Date().toISOString().split('T')[0];
  const previous = existingSitemapLastmods();
  const staticPaths = [
    '', 'software.html', 'content.html', 'articles.html', 'video.html', 'media.html',
    'business.html', 'podcast.html', 'music.html', 'books.html', 'about.html',
    ...Array.from({ length: 6 }, (_, index) => `books/xingsi-wujie/chapter-${String(index + 1).padStart(2, '0')}.html`)
  ];
  const entries = staticPaths.map((relativePath) => {
    const loc = `${domain}/${relativePath}`;
    return { loc, lastmod: refreshStatic ? today : (previous.get(loc) || today) };
  });

  for (const article of articles) {
    if (!article.id) continue;
    entries.push({
      loc: `${domain}/posts/${article.id}.html`,
      lastmod: article.updated || article.date || today
    });
  }

  const urls = entries.map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join('\n');
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(repoRoot, 'sitemap.xml'), sitemapContent, 'utf8');
  console.log(`Successfully generated sitemap.xml (${refreshStatic ? 'refreshed static dates' : 'preserved static dates'})`);
}

function main() {
  const raw = fs.readFileSync(articlesJsonPath, 'utf8');
  const data = JSON.parse(raw);
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const refreshStatic = process.argv.includes('--refresh-static');

  fs.mkdirSync(outputDir, { recursive: true });

  const prepared = [];
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
      title: article.title || markdownTitle || `文章 ${article.id}`,
      description: article.description || markdownDesc || markdownTitle || `文章 ${article.id}`
    };

    const mdWithoutTopTitle = md.replace(/^#\s+.*\r?\n?/m, '');
    const htmlContent = parseMarkdown(mdWithoutTopTitle, basePath).replace(/<h1[^>]*>[\s\S]*?(<\/h1>|\/h1>)/gi, '');
    prepared.push({ article: safeArticle, htmlContent });
  }

  prepared.sort((a, b) => new Date(a.article.date) - new Date(b.article.date));
  prepared.forEach((entry, index) => {
    const previous = prepared[index - 1]?.article;
    const next = prepared[index + 1]?.article;
    const out = articleTemplate(entry.article, entry.htmlContent, { previous, next });
    fs.writeFileSync(path.join(outputDir, `${entry.article.id}.html`), out, 'utf8');
  });

  const safeArticles = prepared.map((entry) => entry.article);
  updateArticleIndex(safeArticles);
  generateSitemap(safeArticles, { refreshStatic });
}

main();
