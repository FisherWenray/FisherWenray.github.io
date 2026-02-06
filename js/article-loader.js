/**
 * Article Loader - 加载和渲染 Markdown 文章
 */

// 简单的 Markdown 解析器
class MarkdownParser {
    static parse(markdown) {
        let html = markdown;

        // 转义 HTML
        html = this.escapeHtml(html);

        // 标题
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

        // 粗体和斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // 代码块
        html = html.replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
        });

        // 行内代码
        html = html.replace(/`([^`]*)`/g, '<code>$1</code>');

        // 链接
        html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" target="_blank">$1</a>');

        // 图片
        html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" class="article-image">');

        // 列表
        html = this.parseList(html);

        // 引用块
        html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

        // 段落
        html = html.split('\n\n').map(para => {
            para = para.trim();
            if (para && 
                !para.startsWith('<h') && 
                !para.startsWith('<pre') && 
                !para.startsWith('<ul') && 
                !para.startsWith('<ol') && 
                !para.startsWith('<blockquote') &&
                !para.startsWith('<img')) {
                return `<p>${para}</p>`;
            }
            return para;
        }).join('\n');

        // 分隔线
        html = html.replace(/^---$/gm, '<hr>');

        return html;
    }

    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    static parseList(html) {
        // 无序列表
        const ulRegex = /^\s*[-*+]\s+(.*)$/gm;
        html = html.replace(/((?:^\s*[-*+]\s+.*$\n?)+)/gm, (match) => {
            const items = match.trim().split('\n').map(line => 
                line.replace(/^\s*[-*+]\s+/, '').trim()
            );
            return '<ul>\n' + items.map(item => `<li>${item}</li>`).join('\n') + '\n</ul>\n';
        });

        // 有序列表
        const olRegex = /^\s*\d+\.\s+(.*)$/gm;
        html = html.replace(/((?:^\s*\d+\.\s+.*$\n?)+)/gm, (match) => {
            const items = match.trim().split('\n').map(line => 
                line.replace(/^\s*\d+\.\s+/, '').trim()
            );
            return '<ol>\n' + items.map(item => `<li>${item}</li>`).join('\n') + '\n</ol>\n';
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
        const htmlContent = MarkdownParser.parse(markdownContent);

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
