import os

old_hex = ["#c5b358", "#c5b358"]
new_hex = "#c5b358"

old_rgb = ["197, 179, 88", "197, 179, 88"]
new_rgb = "197, 179, 88"

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    original_content = content
    for h in old_hex:
        content = content.replace(h, new_hex)
    for r in old_rgb:
        content = content.replace(r, new_rgb)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.css', '.js', '.py', '.md', '.json', '.svg')):
            process_file(os.path.join(root, file))
print("Done!")
