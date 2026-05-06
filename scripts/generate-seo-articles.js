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
      para = para.trim();
      if (
        para &&
        !para.startsWith('<h') &&
        !para.startsWith('<pre') &&
        !para.startsWith('<ul') &&
        !para.startsWith('<ol') &&
        !para.startsWith('<blockquote') &&
        !para.startsWith('<img') &&
        !para.startsWith('<hr') &&
        !para.startsWith('<table') &&
        !para.startsWith('<a') &&
        !/^\s*[-*+]\s+/.test(para) &&
        !/^\s*\d+\.\s+/.test(para)
      ) {
        return `<p>${para.replace(/\r?\n/g, '<br>')}</p>`;
      }
      return para;
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

function stripHtmlTags(input) {
  return String(input).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTitleFromMarkdown(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  if (m && m[1]) return m[1].trim();
  return '';
}

function extractDescriptionFromMarkdown(markdown) {
  const normalized = markdown.replace(/^---[\s\S]*?---\r?\n*/, '');
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('```') && !line.startsWith('>'));
  if (!lines.length) return '';
  const merged = lines.join(' ');
  const plain = merged
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 140);
}

function articleTemplate(article, htmlContent) {
  const title = stripHtmlTags(article.title || '').trim() || `文章 ${article.id || ''}`.trim();
  const desc = (stripHtmlTags(article.description || '').trim() || title)
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const date = article.date || '';
  const canonical = `https://wenyaoyefei.com/posts/${article.id}.html`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: desc,
    author: {
      '@type': 'Person',
      name: article.author || '文鳐夜飞'
    },
    datePublished: date || undefined,
    dateModified: date || undefined,
    mainEntityOfPage: canonical,
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Person',
      name: '文鳐夜飞'
    }
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
  <link rel="icon" type="image/jpeg" href="../微信图片_2026-01-23_124826_064.jpg">
  <style>
    body { margin:0; font-family: "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif; line-height:1.8; color:#273039; background:#f5f7fa; }
    .wrap { max-width:900px; margin:0 auto; padding:24px 16px 48px; }
    .top { margin-bottom:20px; }
    .top a { color:#004E8C; text-decoration:none; margin-right:14px; }
    .card { background:#fff; border:1px solid #dbe3ea; border-radius:14px; padding:28px; box-shadow:0 10px 24px rgba(22,33,44,0.08); }
    h1 { margin:0 0 10px; line-height:1.35; color:#004E8C; font-size:34px; }
    .meta { color:#5f6a75; font-size:14px; margin-bottom:24px; }
    h2,h3,h4 { color:#004E8C; margin-top:1.5em; }
    p { margin:1em 0; }
    img { max-width:100%; height:auto; display:block; margin:16px auto; border-radius:8px; }
    pre { background:#eef2f6; padding:14px; border-radius:8px; overflow:auto; }
    code { font-family: "JetBrains Mono","Consolas",monospace; }
    blockquote { border-left:4px solid #004E8C; margin:1em 0; padding:8px 14px; background:#f3f7fb; }
    a { color:#0b63a8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a href="../index.html">首页</a>
      <a href="../articles.html">Blog</a>
      <a href="../podcast.html">播客</a>
      <a href="../video.html">视频</a>
      <a href="../software.html">产品</a>
      <a href="../music.html">音乐</a>
    </div>
    <article class="card">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">作者：${escapeHtml(article.author || '文鳐夜飞')} · ${escapeHtml(date)} · ${escapeHtml(article.category || '')}</div>
      <div class="content">${htmlContent}</div>
    </article>
  </div>
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
    const htmlContent = parseMarkdown(md, basePath);
    const out = articleTemplate(safeArticle, htmlContent);
    fs.writeFileSync(path.join(outputDir, `${article.id}.html`), out, 'utf8');
  }
}

main();
