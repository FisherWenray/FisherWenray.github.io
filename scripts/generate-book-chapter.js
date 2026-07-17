const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const bookTitle = '行思无界：从见天地到见自己';
const bookTitleWrapped = `《${bookTitle}》`;
const knownRemoteImageSizes = new Map([
  ['https://uploader.shimo.im/f/Dlog31b6ffW7I7vw.png!thumbnail', [1536, 1024]],
  ['https://uploader.shimo.im/f/1rj7ZqIqWcoRnZbs.png!thumbnail', [1586, 992]],
  ['https://uploader.shimo.im/f/JiBEo88DhYhpdlbQ.png!thumbnail', [1536, 1024]],
]);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function slugify(text, fallback) {
  const ascii = text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || fallback;
}

function inlineMarkdown(text) {
  const codeSpans = [];
  let html = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeSpans.length}@@`;
    codeSpans.push(`<code>${code}</code>`);
    return token;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = escapeAttr(url.trim());
    const isExternal = /^https?:\/\//i.test(url);
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeUrl}"${attrs}>${label}</a>`;
  });

  for (let i = 0; i < codeSpans.length; i += 1) {
    html = html.replace(`@@CODE${i}@@`, codeSpans[i]);
  }
  return html;
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/^---[\s\S]*?---\r?\n/, '').split(/\r?\n/);
  const html = [];
  const toc = [];
  let paragraph = [];
  let list = null;
  let quote = [];
  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let skippedFirstTitle = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  const flushQuote = () => {
    if (!quote.length) return;
    html.push(`<blockquote>${quote.map(inlineMarkdown).join('<br>')}</blockquote>`);
    quote = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (inCode) {
      if (/^```/.test(line.trim())) {
        html.push(`<pre><code class="language-${escapeAttr(codeLang || 'text')}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLang = '';
        codeLines = [];
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    const codeMatch = line.match(/^```\s*([A-Za-z0-9_-]*)/);
    if (codeMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      inCode = true;
      codeLang = codeMatch[1] || '';
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      if (level === 1 && !skippedFirstTitle) {
        skippedFirstTitle = true;
        continue;
      }
      const tag = `h${Math.max(level, 2)}`;
      const id = slugify(title, `section-${toc.length + 1}`);
      if (level <= 2) toc.push({ id, title });
      html.push(`<${tag} id="${id}">${inlineMarkdown(title)}</${tag}>`);
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)]\((.+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const imageUrl = imageMatch[2].trim();
      const dimensions = knownRemoteImageSizes.get(imageUrl);
      const sizeAttrs = dimensions ? ` width="${dimensions[0]}" height="${dimensions[1]}"` : '';
      html.push(`<figure><img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(imageMatch[1] || '书籍插图')}"${sizeAttrs} loading="lazy" decoding="async"></figure>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== 'ol') list = { type: 'ol', items: [] };
      list.items.push(orderedMatch[1]);
      continue;
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== 'ul') list = { type: 'ul', items: [] };
      list.items.push(unorderedMatch[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushQuote();

  return { html: html.join('\n'), toc };
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '未命名章节';
}

function extractDescription(markdown) {
  const text = markdown
    .replace(/^---[\s\S]*?---\r?\n/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('>'))[0] || '';
  const plain = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (plain.length <= 120) return plain;
  const candidate = plain.slice(0, 120);
  const punctuation = Math.max(
    candidate.lastIndexOf('。'),
    candidate.lastIndexOf('！'),
    candidate.lastIndexOf('？'),
    candidate.lastIndexOf('；')
  );
  return punctuation >= 70 ? candidate.slice(0, punctuation + 1) : `${candidate.slice(0, 117)}…`;
}

function isChapterTitle(title) {
  return /^(第[一二三四五六七八九十百千万零〇0-9]+章|附录)/.test(title.trim());
}

function chapterFileName(index) {
  return `chapter-${String(index + 1).padStart(2, '0')}.html`;
}

function splitChapters(markdown) {
  const lines = markdown.replace(/^---[\s\S]*?---\r?\n/, '').split(/\r?\n/);
  const chapters = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(.+)$/);
    if (headingMatch && isChapterTitle(headingMatch[1])) {
      if (current) chapters.push(current);
      current = {
        title: headingMatch[1].trim(),
        lines: [line],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) chapters.push(current);

  if (!chapters.length) {
    chapters.push({
      title: extractTitle(markdown),
      lines: markdown.replace(/^---[\s\S]*?---\r?\n/, '').split(/\r?\n/),
    });
  }

  return chapters.map((chapter, index) => ({
    title: /^附录[：:]?\s*$/.test(chapter.title)
      ? '附录：配套音频节目索引'
      : chapter.title.replace(/一人一文明:\s*/g, '一人一文明：'),
    file: chapterFileName(index),
    markdown: chapter.lines.join('\n'),
    sections: chapter.lines
      .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
      .filter(Boolean)
      .map((match, sectionIndex) => {
        const level = match[1].length;
        const title = match[2].trim();
        return {
          level,
          title,
          id: slugify(title, `section-${sectionIndex + 1}`),
        };
      }),
  }));
}

function renderPage({ chapter, chapters, chapterIndex, description, contentHtml }) {
  const canonical = `https://wenyaoyefei.com/books/xingsi-wujie/${chapter.file}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonical}#chapter`,
      headline: chapter.title,
      description,
      image: ['https://wenyaoyefei.com/avatar.jpg'],
      author: { '@type': 'Person', name: '文鳐夜飞', url: 'https://wenyaoyefei.com/about.html' },
      publisher: { '@type': 'Person', name: '文鳐夜飞', url: 'https://wenyaoyefei.com/' },
      isPartOf: { '@type': 'Book', name: bookTitle, url: 'https://wenyaoyefei.com/books.html' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      inLanguage: 'zh-CN'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: 'https://wenyaoyefei.com/' },
        { '@type': 'ListItem', position: 2, name: '书籍', item: 'https://wenyaoyefei.com/books.html' },
        { '@type': 'ListItem', position: 3, name: bookTitle, item: 'https://wenyaoyefei.com/books/xingsi-wujie/chapter-01.html' },
        { '@type': 'ListItem', position: 4, name: chapter.title, item: canonical }
      ]
    }
  ];
  const tocHtml = chapters.length
    ? `<nav class="book-sidebar-nav" aria-label="章节目录">
          ${chapters.map((item, index) => {
            const activeClass = index === chapterIndex ? ' class="active"' : '';
            const currentAttr = index === chapterIndex ? ' aria-current="page"' : '';
            const sectionLinks = item.sections.length
              ? `<div class="book-sidebar-sections">
              ${item.sections.map((section) => {
                const href = `${item.file}#${section.id}`;
                const sectionClass = section.level >= 3 ? ' class="book-sidebar-subsection"' : '';
                return `<a${sectionClass} href="${href}">${escapeHtml(section.title)}</a>`;
              }).join('\n              ')}
            </div>`
              : '';
            return `<div class="book-sidebar-group">
            <a${activeClass}${currentAttr} href="${item.file}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(item.title)}</a>
            ${sectionLinks}
          </div>`;
          }).join('\n          ')}
        </nav>`
    : '';
  const previousChapter = chapters[chapterIndex - 1];
  const nextChapter = chapters[chapterIndex + 1];
  const actionsHtml = [
    previousChapter ? `<a class="card-btn card-btn-secondary" href="${previousChapter.file}"><i class="fas fa-arrow-left"></i> 上一章</a>` : `<a class="card-btn card-btn-secondary" href="../../books.html"><i class="fas fa-book"></i> 返回书籍页</a>`,
    nextChapter ? `<a class="card-btn card-btn-primary" href="${nextChapter.file}">下一章 <i class="fas fa-arrow-right"></i></a>` : `<a class="card-btn card-btn-primary" href="#top"><i class="fas fa-arrow-up"></i> 回到顶部</a>`,
  ].join('\n        ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chapter.title)} - ${escapeHtml(bookTitleWrapped)} | 文鳐夜飞</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="robots" content="noarchive">
  <meta property="og:title" content="${escapeHtml(chapter.title)} - ${escapeHtml(bookTitleWrapped)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://wenyaoyefei.com/avatar.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(chapter.title)} - ${escapeHtml(bookTitleWrapped)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="https://wenyaoyefei.com/avatar.jpg">
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script>document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');</script>
  <script src="../../js/theme.js?v=5" defer></script>
  <link rel="stylesheet" href="../../css/site.css?v=3">
  <link rel="stylesheet" href="../../css/article.css?v=1">
  <link rel="stylesheet" href="../../css/book.css?v=11">
  <link rel="stylesheet" href="../../css/elevated-design.css?v=21">
  <link rel="icon" type="image/jpeg" href="../../avatar.jpg">
</head>
<body>
  <nav class="top-nav">
    <div class="nav-container">
      <ul class="nav-links" id="navLinks">
        <li><a href="../../index.html">首页</a></li>
        <li><a href="../../software.html">产品</a></li>
        <li><a href="../../business.html">服务</a></li>
        <li><a href="../../content.html" class="active">内容</a></li>
        <li><a href="../../about.html">关于</a></li>
      </ul>
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

  <main class="book-shell" data-online-reader="true">
    <aside class="book-sidebar">
      <a class="book-sidebar-back" href="../../books.html"><i class="fas fa-arrow-left"></i> 返回书籍</a>
      <div class="book-sidebar-brand">
        <p>文鳐夜飞</p>
        <h2>${escapeHtml(bookTitleWrapped)}</h2>
        <span>在线阅读 · EPUB 内容</span>
      </div>
      ${tocHtml}
    </aside>

    <article class="book-main">
      <header class="book-reader-header">
        <h1 class="book-reader-title">${escapeHtml(chapter.title)}</h1>
        <p class="book-reader-subtitle">${escapeHtml(bookTitleWrapped)} · 第 ${chapterIndex + 1} / ${chapters.length} 节 · 在线阅读版</p>
      </header>
      <div class="book-reader-layout">
        <div class="article-content book-content" data-book-content>
${contentHtml}
        </div>
      </div>
      <div class="book-reader-actions">
        ${actionsHtml}
      </div>
    </article>
  </main>

  <div class="footer"></div>

  <script src="../../js/umami-config.js"></script>
  <script src="../../js/analytics.js"></script>
  <script>
    function toggleMobileMenu() {
      const navLinks = document.getElementById('navLinks');
      if (navLinks) navLinks.classList.toggle('active');
    }

    (function keepBookSidebarPosition() {
      const sidebar = document.querySelector('.book-sidebar');
      const nav = document.querySelector('.book-sidebar-nav');
      const storageKey = 'wenyao-book-sidebar-scroll';
      if (!sidebar || !nav) return;

      function absoluteLinkKey(url) {
        return url.pathname + url.hash;
      }

      function updateActiveSection() {
        const currentKey = window.location.pathname + window.location.hash;
        nav.querySelectorAll('.book-sidebar-sections a').forEach((link) => {
          const linkUrl = new URL(link.getAttribute('href'), window.location.href);
          link.classList.toggle('active', absoluteLinkKey(linkUrl) === currentKey);
        });
      }

      requestAnimationFrame(function restoreSidebar() {
        const savedScroll = sessionStorage.getItem(storageKey);
        if (savedScroll !== null) {
          sidebar.scrollTop = Number(savedScroll) || 0;
        } else {
          const active = nav.querySelector('a.active');
          if (active) active.scrollIntoView({ block: 'center' });
        }
        updateActiveSection();
      });

      nav.addEventListener('click', function(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        const targetUrl = new URL(link.getAttribute('href'), window.location.href);
        sessionStorage.setItem(storageKey, String(sidebar.scrollTop));

        const samePage = targetUrl.pathname === window.location.pathname;
        if (samePage && targetUrl.hash) {
          event.preventDefault();
          const target = document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)));
          history.pushState(null, '', targetUrl.hash);
          updateActiveSection();
          if (target) target.scrollIntoView({ block: 'start' });
        }
      });

      window.addEventListener('hashchange', updateActiveSection);
    })();

    document.addEventListener('keydown', function(event) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && (key === 's' || key === 'p')) {
        event.preventDefault();
      }
    });
  </script>
</body>
</html>`;
}

function main() {
  const input = process.argv[2];
  const output = process.argv[3] || path.join(repoRoot, 'books', 'xingsi-wujie', 'chapter-01.html');
  if (!input) {
    throw new Error('Usage: node scripts/generate-book-chapter.js <input.md> [output.html]');
  }

  const markdown = fs.readFileSync(input, 'utf8');
  const outputDir = path.extname(output) ? path.dirname(output) : output;
  const chapters = splitChapters(markdown);
  fs.mkdirSync(outputDir, { recursive: true });

  chapters.forEach((chapter, chapterIndex) => {
    const description = /^附录/.test(chapter.title)
      ? `${bookTitleWrapped}配套音频节目索引，汇总间隔年、通识教育、一人一文明与全球生活方式等主题节目。`
      : (extractDescription(chapter.markdown) || `${chapter.title}，文鳐夜飞${bookTitleWrapped}在线阅读章节。`);
    const { html } = parseMarkdown(chapter.markdown);
    const outputPath = path.join(outputDir, chapter.file);
    fs.writeFileSync(outputPath, renderPage({ chapter, chapters, chapterIndex, description, contentHtml: html }), 'utf8');
  });

  console.log(`Generated ${chapters.length} chapters in ${path.relative(repoRoot, outputDir)}`);
}

main();
