# 📋 新建文章发布清单

## 快速发布模板

复制以下内容，按照步骤操作即可发布新文章。

---

## 📝 发布步骤

### Step 1: 创建 Markdown 文件

**文件路径**: `articles/YOUR_ID-title.md`

**文件名规则**:
- `YOUR_ID`: 从 001 开始递增（001, 002, 003...）
- `title`: 英文标题，用连字符连接（如 how-to-start）

**示例**:
```
articles/004-time-management.md
articles/005-reading-habits.md
articles/006-goal-setting.md
```

### Step 2: 编写 Markdown 内容

**最小模板**:
```markdown
# 文章标题

## 小标题1

内容...

## 小标题2

更多内容...
```

**完整示例**（参考已有的三篇文章）

### Step 3: 添加文章到 articles.json

打开 `articles.json`，在 `articles` 数组中添加新对象：

```json
{
  "id": "004",
  "title": "文章标题（中文）",
  "description": "一句话描述，会显示在列表卡片上（50字以内）",
  "author": "文鳐夜飞",
  "date": "2026-02-06",
  "category": "软件出海|投资悟道|自我成长",
  "tags": ["标签1", "标签2", "标签3"],
  "markdown": "articles/004-your-title.md",
  "image": "https://via.placeholder.com/400x200?text=Your+Article",
  "readTime": 10
}
```

**字段填写指南**:

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 唯一 ID，递增数字 | "004" |
| `title` | 文章标题 | "时间管理的艺术" |
| `description` | 简短描述（关键） | "分享个人的时间管理方法论和实践经验" |
| `author` | 作者 | "文鳐夜飞" |
| `date` | 发布日期 | "2026-02-06" |
| `category` | 分类 | "自我成长" |
| `tags` | 标签数组 | ["时间", "管理", "效率"] |
| `markdown` | MD 文件路径 | "articles/004-time-management.md" |
| `image` | 封面图 URL | 可用占位图或真实 URL |
| `readTime` | 阅读时间（分钟） | 8 |

### Step 4: 验证 JSON 格式

确保 `articles.json` 是有效的 JSON：

```bash
# 如果有 Python 可以验证
python -m json.tool articles.json
```

或者在线工具：https://jsonlint.com/

### Step 5: 本地测试

1. 在浏览器中打开 `articles.html`
2. 检查新文章是否出现在列表
3. 点击新文章进入详情页
4. 验证内容是否正确渲染

### Step 6: 提交到 GitHub

```bash
# 进入项目目录
cd /Users/fisher/Documents/workspace/FisherWenray.github.io

# 查看变更
git status

# 添加文件
git add articles/YOUR_FILE.md articles.json

# 或一次添加所有变更
git add .

# 提交
git commit -m "Add article: Your Title"

# 推送
git push origin main
```

### Step 7: 等待部署和验证

- GitHub Pages 通常在 1-2 分钟内部署完成
- 访问你的网站 https://fisherwenray.github.io/articles.html
- 确认新文章出现在线上

---

## 📋 发布前检查清单

发布前，请检查以下项目：

- [ ] Markdown 文件已创建
- [ ] 文件放在 `articles/` 目录下
- [ ] 文件名遵循规则（数字-英文标题）
- [ ] 已在 `articles.json` 中添加条目
- [ ] JSON 格式正确（没有语法错误）
- [ ] 日期格式正确（YYYY-MM-DD）
- [ ] 分类名称正确（必须是现有分类或新分类）
- [ ] 描述字数不超过 50 字
- [ ] 阅读时间估计合理
- [ ] 所有链接和图片都有效
- [ ] 代码块语言标签正确
- [ ] 标签相关性强
- [ ] 本地预览无误
- [ ] Git 提交信息清晰

---

## 📚 Markdown 语法快速参考

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 格式化文本
```markdown
**粗体文本**
*斜体文本*
~~删除线~~
`行内代码`
```

### 列表
```markdown
- 无序项 1
- 无序项 2
  - 嵌套项

1. 有序项 1
2. 有序项 2
3. 有序项 3
```

### 代码块
````markdown
```python
def hello():
    print("Hello")
```
````

### 引用
```markdown
> 这是一个引用
> 多行引用继续用 >
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

### 表格（HTML）
```html
<table>
  <tr><th>列1</th><th>列2</th></tr>
  <tr><td>值1</td><td>值2</td></tr>
</table>
```

---

## 🎯 文章规范建议

### 文章长度
- 最少：800 字
- 最佳：1500-3000 字
- 可接受：最多 5000 字

### 标题结构
- 一个 # 一级标题
- 2-5 个 ## 二级标题
- 适度使用 ### 三级标题

### 标签选择
- 选择 3-5 个标签
- 标签要有代表性
- 避免过于宽泛的标签

### 描述撰写
- 用一句话概括文章主题
- 包含关键词
- 引起读者兴趣

### 发布时间
- 建议同一时间发布（如周日下午）
- 每周 1-2 篇为佳
- 保持连贯性

---

## 🌟 成功发布的例子

### 好的元数据示例：

```json
{
  "id": "004",
  "title": "如何建立个人知识管理系统",
  "description": "分享我用 Obsidian 构建个人知识库的实践经验和心得，包括标签体系、文件夹结构、模板设计等。",
  "author": "文鳐夜飞",
  "date": "2026-02-13",
  "category": "自我成长",
  "tags": ["知识管理", "学习", "效率"],
  "markdown": "articles/004-knowledge-management.md",
  "image": "https://via.placeholder.com/400x200?text=Knowledge+Management",
  "readTime": 12
}
```

### 文章开头好的结构：

```markdown
# 如何建立个人知识管理系统

在信息爆炸的时代，拥有一套有效的知识管理系统变得越来越重要。我用了三年时间，尝试了多种工具，最终建立了一套...

## 为什么需要知识管理系统

大多数人在学习过程中面临的问题：
- 学过的东西容易遗忘
- 信息散落在各个地方
- 无法形成知识体系

## 我的解决方案

我选择用 Obsidian 作为核心工具...

## 系统的四个核心部分

### 1. 标签体系

...
```

---

## ⚠️ 常见错误及解决

### 错误1: JSON 格式错误

❌ 错误：
```json
{
  "id": 004,          // ID 应该是字符串
  "title": "标题",
  "date": 2026-02-06, // 日期应该是字符串
}                     // 多余逗号
```

✅ 正确：
```json
{
  "id": "004",
  "title": "标题",
  "date": "2026-02-06"
}
```

### 错误2: Markdown 语法错误

❌ 错误：
```markdown
##二级标题      // 缺少空格
**粗体         // 缺少结尾标记
```

✅ 正确：
```markdown
## 二级标题
**粗体**
```

### 错误3: 文件路径错误

❌ 错误：
```json
"markdown": "001-software-overseas.md"  // 缺少目录
```

✅ 正确：
```json
"markdown": "articles/001-software-overseas.md"
```

---

## 💡 高级技巧

### 1. 添加数学公式
```markdown
使用 HTML 和 LaTeX：
<img src="https://latex.codecogs.com/svg.image?E=mc^2" />
```

### 2. 嵌入视频
```html
<iframe width="100%" height="400" 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  frameborder="0"></iframe>
```

### 3. 添加高亮代码行
```python
def important_function():
    # 这是一行很重要的代码
    result = expensive_calculation()
    return result
```

### 4. 使用 HTML 表格
```html
<table border="1">
  <tr>
    <th>标题1</th>
    <th>标题2</th>
  </tr>
  <tr>
    <td>内容1</td>
    <td>内容2</td>
  </tr>
</table>
```

---

## 📞 遇到问题？

### 检查清单：

1. **页面不显示新文章**
   - [ ] articles.json 格式正确
   - [ ] markdown 路径正确
   - [ ] 刷新浏览器缓存（Ctrl+Shift+R）
   - [ ] 检查浏览器控制台错误

2. **Markdown 不渲染**
   - [ ] 检查文件编码（应为 UTF-8）
   - [ ] 检查 Markdown 语法错误
   - [ ] 确保文件在正确目录

3. **样式不对**
   - [ ] 检查 CSS 是否加载
   - [ ] 刷新浏览器缓存
   - [ ] 检查浏览器兼容性

---

## 🎉 发布成功！

恭喜！你已经发布了一篇新文章！

### 后续可做的事情：

1. **分享推广**
   - 在微博分享文章链接
   - 在公众号推送摘要
   - 在知乎等平台引用

2. **收集反馈**
   - 留意读者评论
   - 通过社交媒体获取反馈
   - 根据反馈改进下一篇

3. **持续创作**
   - 计划下周的文章主题
   - 养成定期写作的习惯
   - 建立稳定的读者群体

---

**祝你的写作之旅顺利！** 🚀

有任何疑问，参考 `ARTICLES_README.md` 或 `ARCHITECTURE.md` 获取更详细的信息。
