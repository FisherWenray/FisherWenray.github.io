import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Update variables
    content = re.sub(r'--deep:\s*#000814;', '--deep: #000000;', content)
    content = re.sub(r'--paper:\s*#000814;', '--paper: #000000;', content)
    # Be careful not to replace it if it's already FACC15
    if '--gold: #FACC15;' not in content:
        content = re.sub(r'--gold:\s*#c5b358;\s*([^\s]*)\s*--ink:', '--gold: #FACC15;\n            --ink:', content)

    # 2. Update body background
    old_body_regex = r'\[data-theme=\'dark\'\]\s+body\s*\{\s*background:\s*radial-gradient\(circle at 50% -20%, rgba\(0, 78, 140, 0.3\) 0%, transparent 50%\),\s*radial-gradient\(circle at 100% 100%, rgba\(0, 78, 140, 0.1\) 0%, transparent 50%\),\s*var\(--paper\) !important;'
    new_body = r"[data-theme='dark'] body {\n            background:\n                radial-gradient(circle at 50% -20%, rgba(250, 204, 21, 0.15) 0%, transparent 50%),\n                radial-gradient(circle at 100% 100%, rgba(250, 204, 21, 0.05) 0%, transparent 50%),\n                var(--paper) !important;"
    content = re.sub(old_body_regex, new_body, content)

    # 3. Update nav active links
    old_nav_regex = r'\[data-theme=\'dark\'\]\s+\.nav-links\s+a:hover,\s*\[data-theme=\'dark\'\]\s+\.nav-links\s+a\.active\s*\{\s*color:\s*#FFFFFF\s*!important;\s*background:\s*var\(--primary\)\s*!important;\s*box-shadow:\s*0\s*0\s*20px\s*rgba\(0,\s*78,\s*140,\s*0\.5\)\s*!important;\s*border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.3\)\s*!important;\s*\}'
    new_nav = r"[data-theme='dark'] .nav-links a:hover,\n        [data-theme='dark'] .nav-links a.active {\n            color: var(--gold) !important;\n            background: rgba(250, 204, 21, 0.1) !important;\n            box-shadow: 0 0 20px rgba(250, 204, 21, 0.2) !important;\n            border-color: rgba(250, 204, 21, 0.4) !important;\n        }"
    content = re.sub(old_nav_regex, new_nav, content)

    # 4. Update strong tags
    old_strong_regex = r'\[data-theme=\'dark\'\]\s+strong,\s*\[data-theme=\'dark\'\]\s+\.article-content\s+strong,\s*\[data-theme=\'dark\'\]\s+\.hero-point-text\s+strong\s*\{\s*color:\s*#FFFFFF\s*!important;\s*text-shadow:\s*none\s*!important;\s*font-weight:\s*700\s*!important;\s*\}'
    new_strong = r"[data-theme='dark'] strong,\n        [data-theme='dark'] .article-content strong,\n        [data-theme='dark'] .hero-point-text strong {\n            color: var(--gold) !important;\n            text-shadow: 0 0 10px rgba(250, 204, 21, 0.3) !important;\n            font-weight: 700 !important;\n        }"
    content = re.sub(old_strong_regex, new_strong, content)

    # 5. Fix icons
    old_icons_regex = r'\[data-theme=\'dark\'\]\s+\.teaser-link,\s*\[data-theme=\'dark\'\]\s+\.featured-icon\s*\{\s*color:\s*#75B8EE\s*!important;\s*\}\s*\[data-theme=\'dark\'\]\s+\.teaser-meta\s+i\s*\{\s*color:\s*#75B8EE\s*!important;\s*\}'
    new_icons = r"[data-theme='dark'] .teaser-link,\n        [data-theme='dark'] .featured-icon,\n        [data-theme='dark'] .channel-icon {\n            color: var(--gold) !important;\n        }\n\n        [data-theme='dark'] .teaser-meta i {\n            color: var(--gold) !important;\n        }"
    content = re.sub(old_icons_regex, new_icons, content)

    # 6. Revert large headings
    old_headings_regex = r'\[data-theme=\'dark\'\]\s+\.section-title,\s*\[data-theme=\'dark\'\]\s+\.name,\s*\[data-theme=\'dark\'\]\s+\.wechat-id,\s*\[data-theme=\'dark\'\]\s+\.modal-content\s+h2,\s*\[data-theme=\'dark\'\]\s+\.channel-title,\s*\[data-theme=\'dark\'\]\s+\.products-title,\s*\[data-theme=\'dark\'\]\s+\.teaser-title\s*\{\s*color:\s*var\(--gold\)\s*!important;\s*font-weight:\s*700\s*!important;\s*text-shadow:\s*0\s*0\s*15px\s*rgba\(250,\s*204,\s*21,\s*0\.4\);\s*\}'
    new_headings = r"[data-theme='dark'] .section-title,\n        [data-theme='dark'] .name,\n        [data-theme='dark'] .wechat-id,\n        [data-theme='dark'] .modal-content h2,\n        [data-theme='dark'] .channel-title,\n        [data-theme='dark'] .products-title,\n        [data-theme='dark'] .teaser-title {\n            color: #FFFFFF !important;\n            font-weight: 700 !important;\n            text-shadow: 0 0 10px rgba(0, 78, 140, 0.3);\n        }"
    content = re.sub(old_headings_regex, new_headings, content)
    
    # What if the files already have the original headings but we want to make sure they are correct?
    # Actually the original headings are #FFFFFF. If it matches #FFFFFF, it won't be replaced, which is fine!

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    # skip .git
    if '.git' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
