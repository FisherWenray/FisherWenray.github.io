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
    return `<img src="../${finalUrl}" alt="${alt}" loading="lazy" decoding="async">`;
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
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script src="../js/theme.js"></script>
  <link rel="icon" type="image/jpeg" href="../微信图片_2026-01-23_124826_064.jpg">
  <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root { --primary:#004E8C; --primary-rgb:0,78,140; --deep:#2A3645; --gold:#c5b358; --ink:#273039; --ink-soft:#5f6a75; --paper:#f4f6f8; --surface:rgba(255,255,255,0.86); --line:rgba(0,78,140,0.22); --radius-lg:20px; --shadow:0 20px 44px rgba(28,39,50,0.13); }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Noto Sans SC',sans-serif;color:var(--ink);min-height:100vh;background:radial-gradient(1200px 620px at 88% 6%, rgba(var(--primary-rgb),.22), transparent 62%),radial-gradient(980px 560px at 8% 92%, rgba(42,54,69,.12), transparent 60%),linear-gradient(180deg,#f8fafc 0%,var(--paper) 56%,#eef2f6 100%)}
    .top-nav{position:sticky;top:0;z-index:120;background:rgba(244,246,248,.84);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
    .nav-container{display:flex;justify-content:space-between;align-items:center;width:min(1200px,94vw);margin:0 auto}
    .nav-links{display:flex;gap:10px;list-style:none;flex-wrap:wrap;padding:14px 0}
    .nav-links a{display:block;text-decoration:none;color:var(--ink-soft);font-weight:600;font-size:14px;padding:10px 0;width:80px;text-align:center;border-radius:999px;border:1px solid transparent;transition:.25s}
    .nav-links a:hover,.nav-links a.active{color:var(--primary);border-color:rgba(var(--primary-rgb),.36);background:rgba(var(--primary-rgb),.08)}
    .theme-toggle{background:rgba(var(--primary-rgb),.08);border:1px solid var(--line);color:var(--primary);cursor:pointer;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:.3s;flex-shrink:0;margin-left:10px}
    .page{width:min(1200px,94vw);margin:28px auto 34px}
    .container{border-radius:var(--radius-lg);border:1px solid var(--line);background:var(--surface);box-shadow:var(--shadow);overflow:hidden}
    .article-header{padding:36px 38px 26px;text-align:center;border-bottom:1px solid rgba(var(--primary-rgb),.16);background:linear-gradient(155deg, rgba(var(--primary-rgb),.1), rgba(255,255,255,.96))}
    .article-title{font-family:'Noto Serif SC',serif;font-size:clamp(28px,4.5vw,42px);color:var(--primary);line-height:1.3;margin-bottom:12px}
    .article-meta{display:flex;justify-content:center;gap:12px 22px;flex-wrap:wrap;font-size:13px;color:#86929f}
    .meta-item{display:inline-flex;align-items:center;gap:7px}
    .article-body{padding:clamp(20px,4vw,44px) clamp(18px,5vw,56px) clamp(28px,5vw,48px)}
    .article-content{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#000;line-height:1.6;font-size:16px}
    .article-content h1,.article-content h2,.article-content h3,.article-content h4,.article-content h5,.article-content h6{color:var(--primary);font-weight:700;margin-top:1.5em;margin-bottom:1em;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif}
    .article-content h1{display:none}
    .article-content h2{border-bottom:1px solid #eef2f5;padding-bottom:5px;font-size:clamp(22px,2.8vw,30px)}
    .article-content h3{font-size:clamp(19px,2.4vw,24px)}
    .article-content p{margin-bottom:1.2em;text-align:justify}
    .article-content a{color:var(--gold);text-decoration:none;border-bottom:1px dashed var(--gold)}
    .article-content strong{color:#000;padding:0 2px;font-weight:700}
    .article-content blockquote{border-left:4px solid var(--primary);padding:10px 20px;background:#f0f4f7;color:#555;font-style:italic;margin:20px 0;border-radius:0 4px 4px 0}
    .article-content ul,.article-content ol{margin:18px 0 18px 28px}
    .article-content li{margin-bottom:10px}
    .article-content li::marker{color:var(--gold);font-weight:700}
    .article-content code{background:#f1f4f6;color:#4a6376;padding:2px 5px;border-radius:4px;font-family:'Cascadia Code','JetBrains Mono','Consolas',monospace;font-size:.9em;border:1px solid #e2e8ee}
    .article-content pre{background:#e2e9ef;color:#2c3e50;border:1px solid #d4c36d;border-radius:8px;padding:20px;margin:25px 0;overflow-x:auto}
    .article-content pre::before{content:'CODE';display:block;font-size:10px;color:var(--primary);margin-bottom:12px;opacity:.5;letter-spacing:2px;font-weight:700;font-family:'JetBrains Mono',monospace}
    .article-content pre code{background:transparent;color:inherit;padding:0;border:none;font-size:14px;font-family:'JetBrains Mono','Cascadia Code','Consolas',monospace}
    .article-content table{width:100%;margin-bottom:20px;border-collapse:collapse}
    .article-content thead th{background:var(--primary);color:#fff;padding:10px;text-align:left}
    .article-content td,.article-content th{border:1px solid #dfe2e5;padding:8px 12px}
    .article-content tr:nth-child(2n){background:#f6f8fa}
    .article-content hr{height:1px;padding:0;margin:24px 0;background:#eee;border:none}
    .article-content img{max-width:100%;height:auto;border-radius:8px;margin:20px auto;display:block}
    .footer{width:min(1200px,94vw);margin:40px auto 34px;text-align:center;color:#8b97a2;font-size:13px;border-top:1px solid var(--line);padding-top:30px}
    [data-theme='dark']{--primary:#004E8C;--primary-rgb:0,78,140;--deep:#000814;--gold:#c5b358;--ink:#fff;--ink-soft:#A0B3C6;--paper:#000814;--surface:rgba(0,78,140,.08);--line:rgba(0,78,140,.4);--shadow:0 8px 32px 0 rgba(0,0,0,.8)}
    [data-theme='dark'] body{background:radial-gradient(circle at 50% -20%, rgba(0,78,140,.3) 0%, transparent 50%),radial-gradient(circle at 100% 100%, rgba(0,78,140,.1) 0%, transparent 50%),var(--paper)!important;color:var(--ink)!important}
    [data-theme='dark'] .top-nav{background:rgba(0,8,20,.8)!important;backdrop-filter:blur(20px)!important;border-bottom:1px solid var(--line)}
    [data-theme='dark'] .container{background:var(--surface)!important;backdrop-filter:blur(16px)!important;border:1px solid var(--line)!important;box-shadow:var(--shadow)!important}
    [data-theme='dark'] .article-header{background:rgba(0,78,140,.05)!important;border-bottom:1px solid var(--line)!important}
    [data-theme='dark'] .nav-links a{color:var(--ink-soft)}
    [data-theme='dark'] .nav-links a:hover,[data-theme='dark'] .nav-links a.active{color:#fff!important;background:var(--primary)!important;border-color:rgba(255,255,255,.3)!important}
    [data-theme='dark'] .article-title,[data-theme='dark'] .article-content h1,[data-theme='dark'] .article-content h2,[data-theme='dark'] .article-content h3,[data-theme='dark'] .article-content h4{color:#fff!important}
    [data-theme='dark'] .article-content p,[data-theme='dark'] .article-content li{color:#dbe9f8!important}
    [data-theme='dark'] .article-content h2{border-bottom:2px solid var(--gold)!important}
    [data-theme='dark'] .article-content blockquote{color:var(--ink-soft)!important;border-left:4px solid var(--gold)!important;background:rgba(0,78,140,.1)!important}
    [data-theme='dark'] .article-content strong{color:#c5b358!important;text-shadow:0 0 5px rgba(197,179,88,.2)!important}
    [data-theme='dark'] .article-content code{background:rgba(0,78,140,.2)!important;color:#60a5fa!important}
    [data-theme='dark'] .article-content pre{background:#05080a!important;border-color:var(--line)!important}
    @media (max-width:760px){.nav-links{justify-content:flex-start}.article-meta{justify-content:flex-start}.article-header{padding:28px 20px 22px}}
  </style>
</head>
<body>
  <nav class="top-nav">
    <div class="nav-container">
      <ul class="nav-links">
        <li><a href="../index.html">首页</a></li>
        <li><a href="../articles.html" class="active">Blog</a></li>
        <li><a href="../podcast.html">播客</a></li>
        <li><a href="../video.html">视频</a></li>
        <li><a href="../software.html">产品</a></li>
        <li><a href="../music.html">音乐</a></li>
      </ul>
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="切换主题"><i class="fas fa-moon"></i></button>
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

  <div class="footer"><p>© All Rights Reserved.</p></div>
</body>
</html>`;
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
}

main();
