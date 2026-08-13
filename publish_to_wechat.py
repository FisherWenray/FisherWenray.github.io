import os
import sys
import subprocess
import urllib.parse

def main():
    if len(sys.argv) < 2:
        print("Usage: python publish_to_wechat.py <path_to_markdown_file>")
        print("Example: python publish_to_wechat.py articles/article-011.md")
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"Error: File '{filepath}' not found.")
        sys.exit(1)

    # 读取 Markdown 内容
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 将内容复制到剪贴板 (macOS)
    try:
        process = subprocess.Popen('pbcopy', env={'LANG': 'en_US.UTF-8'}, stdin=subprocess.PIPE)
        process.communicate(content.encode('utf-8'))
        print("✅ Markdown 内容已成功复制到剪贴板！")
    except Exception as e:
        print(f"⚠️ 复制到剪贴板失败，请手动复制文件内容: {e}")

    # 提示打开 MDNice 并粘贴
    print("\n👉 正在打开微信公众号 Markdown 排版工具 (MDNice)...")
    print("👉 请在打开的网页中按 Cmd+V (或 Ctrl+V) 粘贴内容。")
    print("👉 首次使用请在 MDNice 主题设置中粘贴项目目录下的 `wechat_theme.css`。")

    # 打开浏览器
    url = "https://mdnice.com/"
    subprocess.run(['open', url])

if __name__ == '__main__':
    main()
