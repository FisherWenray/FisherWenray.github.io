const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules']);

function walk(directory, extension, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, extension, result);
    else if (entry.name.endsWith(extension)) result.push(fullPath);
  }
  return result;
}

function textMatch(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || '';
}

function publicFileForUrl(url) {
  const parsed = new URL(url, 'https://wenyaoyefei.com/');
  if (parsed.origin !== 'https://wenyaoyefei.com') return null;
  const pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') return path.join(root, 'index.html');
  const relative = pathname.replace(/^\/+/, '');
  return path.join(root, relative.endsWith('/') ? relative + 'index.html' : relative);
}

const errors = [];
const warnings = [];
const htmlFiles = walk(root, '.html').filter((file) => !file.includes(`${path.sep}tmp${path.sep}`));

for (const file of htmlFiles) {
  const relative = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  const noindex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const title = textMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = textMatch(html, /<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i);
  const canonical = textMatch(html, /<link\s+rel=["']canonical["'][^>]*href=["']([^"']*)/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing meta description`);
  if (!noindex && !canonical) errors.push(`${relative}: missing canonical`);
  if (!noindex && h1Count !== 1) errors.push(`${relative}: expected one h1, found ${h1Count}`);
  if (!noindex && !/<meta\s+property=["']og:title["']/i.test(html)) errors.push(`${relative}: missing og:title`);
  if (!noindex && !/<meta\s+name=["']twitter:card["']/i.test(html)) errors.push(`${relative}: missing twitter:card`);
  if (/fonts\.googleapis|fonts\.gstatic|font-awesome/i.test(html)) errors.push(`${relative}: remote font dependency remains`);
  if (/javascript:void/i.test(html)) errors.push(`${relative}: javascript:void link remains`);

  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\bwidth=["'][^"']+["']/i.test(tag) || !/\bheight=["'][^"']+["']/i.test(tag)) {
      warnings.push(`${relative}: image missing intrinsic dimensions: ${tag.slice(0, 120)}`);
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#?]+)(?:#[^"']*)?["']/gi)) {
    const href = match[1];
    if (href.includes('${')) continue;
    if (/^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(href)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(href));
    const resolved = href.endsWith('/') ? path.join(target, 'index.html') : target;
    if (!fs.existsSync(resolved)) errors.push(`${relative}: broken internal link ${href}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const target = publicFileForUrl(match[1]);
  if (target && !fs.existsSync(target)) errors.push(`sitemap.xml: missing target ${match[1]}`);
}
if (/\/article\.html<\/loc>/.test(sitemap)) errors.push('sitemap.xml: legacy noindex route is included');

const articleIndex = fs.readFileSync(path.join(root, 'articles.html'), 'utf8');
const staticCardBlock = articleIndex.match(/SEO_ARTICLE_CARDS_START -->([\s\S]*?)<!-- SEO_ARTICLE_CARDS_END/)?.[1] || '';
const staticCards = (staticCardBlock.match(/<a\s+class=["']article-card["']/g) || []).length;
if (staticCards !== 11) errors.push(`articles.html: expected 11 static article cards, found ${staticCards}`);

console.log(`Audited ${htmlFiles.length} HTML files.`);
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.log(`  - ${warning}`));
}
if (errors.length) {
  console.error(`Errors (${errors.length}):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exitCode = 1;
} else {
  console.log('SEO audit passed with no blocking errors.');
}
