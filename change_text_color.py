import os
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    original_content = content

    # Replace color: #c5b358 with color: #c5b358
    content = re.sub(r'color:\s*var\(--primary\)', 'color: #c5b358', content)
    
    # Replace color: #c5b358 with color: #c5b358 (case insensitive)
    content = re.sub(r'color:\s*#004e8c', 'color: #c5b358', content, flags=re.IGNORECASE)

    # What about HTML elements that might have 'text-primary' class or something?
    # If there are explicit blue text colors.
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated text color in {filepath}")

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.html', '.css', '.js', '.py', '.md', '.json', '.svg')):
            process_file(os.path.join(root, file))
print("Done!")
