# 文章系统使用说明

## 项目结构

```
FisherWenray.github.io/
├── index.html                          # 主页
├── articles.html                       # 文章列表页面
├── article.html                        # 文章详情页面（动态加载）
├── articles.json                       # 文章元数据配置文件
├── js/
│   └── article-loader.js              # 文章加载和 Markdown 渲染脚本
└── articles/                           # Markdown 文章存储目录
    ├── 001-software-overseas.md        # 示例文章1
    ├── 002-investment-logic.md         # 示例文章2
    └── 003-personal-growth.md          # 示例文章3
```

## 快速开始

### 1. 查看文章列表
访问 `articles.html` 即可看到所有文章列表，支持按分类过滤。

### 2. 查看文章详情
点击任何文章卡片即可进入详情页面，Markdown 内容会自动渲染。

## 如何发布新文章

### 步骤1：编写 Markdown 文章
在 `articles/` 目录下新建一个 Markdown 文件，例如 `004-your-title.md`

```markdown
# 你的文章标题

## 第一个章节

文章内容...

## 第二个章节

更多内容...
```

### 步骤2：添加文章元数据到 articles.json

打开 `articles.json` 文件，在 `articles` 数组中添加新的文章对象：

```json
{
  "id": "004",
  "title": "文章标题",
  "description": "文章简短描述，会显示在列表页面",
  "author": "文鳐夜飞",
  "date": "2026-02-06",
  "category": "软件出海",
  "tags": ["标签1", "标签2", "标签3"],
  "markdown": "articles/004-your-title.md",
  "image": "https://via.placeholder.com/400x200?text=Article",
  "readTime": 10
}
```

**字段说明**：
- `id`: 唯一标识符（建议用递增的数字）
- `title`: 文章标题
- `description`: 简短描述（显示在列表卡片上）
- `author`: 作者名字
- `date`: 发布日期（YYYY-MM-DD 格式）
- `category`: 分类（会用于列表页面的过滤）
- `tags`: 标签数组（显示在文章页面底部）
- `markdown`: Markdown 文件的路径
- `image`: 封面图片 URL（可以使用占位符或自己的图片）
- `readTime`: 预计阅读时间（单位：分钟）

### 步骤3：完成！
刷新页面，新文章就会出现在列表中。

## Markdown 支持的语法

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 强调
```markdown
**粗体文本**
*斜体文本*
***粗斜体***
```

### 列表
```markdown
- 无序列表项1
- 无序列表项2
- 无序列表项3

1. 有序列表项1
2. 有序列表项2
3. 有序列表项3
```

### 代码
```markdown
行内代码：`code`

代码块：
\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`
```

### 引用
```markdown
> 这是一个引用块
> 可以多行
```

### 链接和图片
```markdown
[链接文本](https://example.com)
![图片描述](https://example.com/image.jpg)
```

### 分割线
```markdown
---
```

## 分类管理

### 当前分类
- 软件出海
- 投资悟道
- 自我成长

### 添加新分类
只需在 `articles.json` 中的文章对象里设置新的 `category` 值，列表页面会自动生成过滤按钮。

## 主题说明

整个文章系统采用了你主页的设计主题：

- **主色调**：`#5D7B93`（蓝灰色）
- **辅助色**：`#c5b358`（金色）
- **背景**：蓝灰色渐变
- **字体**：系统默认字体栈

所有 HTML 和 CSS 都与主页保持一致的视觉风格。

## 高级功能

### 自定义 CSS
如果你想修改文章页面的样式，可以在 `article.html` 中的 `<style>` 标签内修改 CSS。

### 代码高亮
文章中的代码块会自动被语法高亮处理，支持多种编程语言。

### 社交分享
在文章页面底部有分享按钮，支持：
- 分享到微博
- 复制链接

### 响应式设计
所有页面都支持响应式设计，在手机、平板和桌面端都有良好的表现。

## 发布工作流建议

1. **本地编写**：在 `articles/` 目录下创建 Markdown 文件
2. **写元数据**：在 `articles.json` 中添加文章信息
3. **本地测试**：在浏览器中打开 `articles.html` 预览
4. **提交发布**：提交到 GitHub Pages

## 常见问题

### Q: 如何修改文章？
A: 修改对应的 Markdown 文件或 JSON 中的元数据，刷新页面即可看到更新。

### Q: 如何删除文章？
A: 从 `articles.json` 中删除对应的文章对象即可（不需要删除 Markdown 文件）。

### Q: 可以上传本地图片吗？
A: 可以。在 `articles/` 目录或根目录创建 `images/` 文件夹，将图片上传后在 Markdown 中引用本地路径。

### Q: Markdown 解析器支持表格吗？
A: 当前版本不支持 GFM 表格语法，但可以使用 HTML 的 `<table>` 标签。

### Q: 可以在文章中插入视频吗？
A: 可以使用 HTML 的 `<iframe>` 标签在 Markdown 中插入视频。

## 技术栈

- **前端**：纯 HTML + CSS + JavaScript（无框架依赖）
- **Markdown 解析**：自定义轻量级解析器
- **代码高亮**：Highlight.js
- **部署**：GitHub Pages

## 后续扩展建议

如果你想进一步增强这个系统，可以考虑：

1. **全文搜索**：添加客户端搜索功能
2. **评论系统**：集成第三方评论服务（如 Disqus）
3. **订阅功能**：添加邮件订阅功能
4. **统计分析**：集成 Google Analytics
5. **自动目录**：自动生成文章目录导航
6. **文章推荐**：根据标签推荐相关文章

## 许可证

这是为你的个人网站创建的项目。自由使用和修改。

---

祝你的写作之旅顺利！🚀
