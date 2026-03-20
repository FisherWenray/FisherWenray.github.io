/**
 * Article Loader - 加载和渲染 Markdown 文章
 */

// 简单的 Markdown 解析器
class MarkdownParser {
    static parse(markdown, basePath = '') {
        let html = markdown;

        // 移除顶部的 YAML Front Matter
        html = html.replace(/^---[\s\S]*?---\n*/, '');

        // 标题
        html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

        // 粗体和斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/\b__(.*?)__\b/g, '<strong>$1</strong>');
        html = html.replace(/\b_(.*?)_\b/g, '<em>$1</em>');

        // 代码块
        html = html.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
        });

        // 行内代码
        html = html.replace(/`([^`]*)`/g, '<code>$1</code>');

        // 图片 - 处理相对路径
        html = html.replace(/!\[([^\]]*)\]\(((?:[^()]+|\([^)]+\))*)\)/g, (match, alt, url) => {
            let finalUrl = url;
            if (basePath && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
                finalUrl = basePath + '/' + url;
            }
            return `<img src="${finalUrl}" alt="${alt}" class="article-image">`;
        });

        // 链接
        html = html.replace(/(^|[^!])\[([^\]]*)\]\(((?:[^()]+|\([^)]+\))*)\)/g, (match, prefix, text, url) => {
            return `${prefix}<a href="${url}" target="_blank">${text}</a>`;
        });

        // 引用块 - 将连续的 > 行合并为一个 blockquote
        html = html.replace(/(^>.*(?:\r?\n>.*)*)/gm, (match) => {
            const content = match.split(/\r?\n/).map(line => line.replace(/^> ?/, '')).join('<br>');
            return `<blockquote>${content}</blockquote>`;
        });

        // 段落 - 改进：支持包含空格的空行分割，并更准确地识别需要包裹 p 标签的内容
        html = html.split(/\r?\n\s*\r?\n/).map(para => {
            para = para.trim();
            if (para && 
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
                !/^\s*\d+\.\s+/.test(para)) {
                return `<p>${para.replace(/\r?\n/g, '<br>')}</p>`;
            }
            return para;
        }).join('\n');

        // 分隔线
        html = html.replace(/^---$/gm, '<hr>');

        // 列表
        html = this.parseList(html);

        return html;
    }

    static escapeHtml(text) {
        return text;
    }

    static parseList(html) {
        // 无序列表
        html = html.replace(/((?:^\s*[-*+]\s+.*\n?)+)/gm, (match) => {
            const items = match.trim().split('\n').map(line => 
                line.replace(/^\s*[-*+]\s+/, '').replace(/<br\s*\/?>/gi, '').trim()
            );
            return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
        });

        // 有序列表
        html = html.replace(/((?:^\s*\d+\.\s+.*\n?)+)/gm, (match) => {
            const items = match.trim().split('\n').map(line => 
                line.replace(/^\s*\d+\.\s+/, '').replace(/<br\s*\/?>/gi, '').trim()
            );
            return '<ol>' + items.map(item => `<li>${item}</li>`).join('') + '</ol>';
        });

        return html;
    }
}

// 加载文章函数
async function loadArticle(articleId) {
    try {
        // 加载文章列表
        const response = await fetch('articles.json');
        const data = await response.json();
        const article = data.articles.find(a => a.id === articleId);

        if (!article) {
            document.getElementById('articleContent').innerHTML = 
                '<div class="error">文章不存在</div>';
            return null;
        }

        // 加载 Markdown 内容
        const markdownResponse = await fetch(article.markdown);
        const markdownContent = await markdownResponse.text();

        // 解析 Markdown 为 HTML
        const basePath = article.markdown.substring(0, article.markdown.lastIndexOf('/'));
        const htmlContent = MarkdownParser.parse(markdownContent, basePath);

        return {
            ...article,
            htmlContent
        };
    } catch (error) {
        console.error('加载文章失败:', error);
        document.getElementById('articleContent').innerHTML = 
            '<div class="error">加载文章失败，请稍后重试</div>';
        return null;
    }
}

// 获取 URL 参数
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 导出函数
window.ArticleLoader = {
    load: loadArticle,
    getUrlParam: getUrlParam,
    MarkdownParser: MarkdownParser
};
