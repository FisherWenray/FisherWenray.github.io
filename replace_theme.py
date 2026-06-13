import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace variables in [data-theme='dark']
content = re.sub(r'--deep:\s*#000814;', '--deep: #000000;', content)
content = re.sub(r'--paper:\s*#000814;', '--paper: #000000;', content)
content = re.sub(r'--gold:\s*#c5b358;\s*([^\s]*)\s*--ink:', '--gold: #FACC15;\n            --ink:', content)

# Replace dark mode body background
old_body = """        [data-theme='dark'] body {
            background:
                radial-gradient(circle at 50% -20%, rgba(0, 78, 140, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(0, 78, 140, 0.1) 0%, transparent 50%),
                var(--paper) !important;
            color: var(--ink) !important;
            position: relative;
        }"""
new_body = """        [data-theme='dark'] body {
            background:
                radial-gradient(circle at 50% -20%, rgba(250, 204, 21, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(250, 204, 21, 0.05) 0%, transparent 50%),
                var(--paper) !important;
            color: var(--ink) !important;
            position: relative;
        }"""
content = content.replace(old_body, new_body)

# Replace dark mode nav links active
old_nav = """        [data-theme='dark'] .nav-links a:hover,
        [data-theme='dark'] .nav-links a.active {
            color: #FFFFFF !important;
            background: var(--primary) !important;
            box-shadow: 0 0 20px rgba(0, 78, 140, 0.5) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
        }"""
new_nav = """        [data-theme='dark'] .nav-links a:hover,
        [data-theme='dark'] .nav-links a.active {
            color: var(--gold) !important;
            background: rgba(250, 204, 21, 0.1) !important;
            box-shadow: 0 0 20px rgba(250, 204, 21, 0.2) !important;
            border-color: rgba(250, 204, 21, 0.4) !important;
        }"""
content = content.replace(old_nav, new_nav)

# Replace dark mode titles
old_titles = """        [data-theme='dark'] .section-title,
        [data-theme='dark'] .name,
        [data-theme='dark'] .wechat-id,
        [data-theme='dark'] .modal-content h2,
        [data-theme='dark'] .channel-title {
            color: #FFFFFF !important;
            font-weight: 700 !important;
            text-shadow: 0 0 10px rgba(0, 78, 140, 0.3);
        }"""
new_titles = """        [data-theme='dark'] .section-title,
        [data-theme='dark'] .name,
        [data-theme='dark'] .wechat-id,
        [data-theme='dark'] .modal-content h2,
        [data-theme='dark'] .channel-title,
        [data-theme='dark'] .products-title,
        [data-theme='dark'] .teaser-title {
            color: var(--gold) !important;
            font-weight: 700 !important;
            text-shadow: 0 0 15px rgba(250, 204, 21, 0.4);
        }"""
content = content.replace(old_titles, new_titles)

# Replace dark mode strong
old_strong = """        [data-theme='dark'] strong,
        [data-theme='dark'] .article-content strong,
        [data-theme='dark'] .hero-point-text strong {
            color: #FFFFFF !important;
            text-shadow: none !important;
            font-weight: 700 !important;
        }"""
new_strong = """        [data-theme='dark'] strong,
        [data-theme='dark'] .article-content strong,
        [data-theme='dark'] .hero-point-text strong {
            color: var(--gold) !important;
            text-shadow: 0 0 10px rgba(250, 204, 21, 0.3) !important;
            font-weight: 700 !important;
        }"""
content = content.replace(old_strong, new_strong)

# Replace dark mode icons
old_icons = """        [data-theme='dark'] .teaser-link,
        [data-theme='dark'] .featured-icon {
            color: #75B8EE !important;
        }

        [data-theme='dark'] .teaser-meta i {
            color: #75B8EE !important;
        }"""
new_icons = """        [data-theme='dark'] .teaser-link,
        [data-theme='dark'] .featured-icon,
        [data-theme='dark'] .channel-icon {
            color: var(--gold) !important;
        }

        [data-theme='dark'] .teaser-meta i {
            color: var(--gold) !important;
        }"""
content = content.replace(old_icons, new_icons)

# Replace hero summary HTML to add strong tags
old_hero = '<p class="hero-summary">一个有着嬉皮精神的科技爱好者，聚焦 OPC 创业、投资、自我成长</p>'
new_hero = '<p class="hero-summary">一个有着嬉皮精神的科技爱好者，分享<strong>OPC 创业</strong>、<strong>投资</strong>、<strong>自我成长</strong></p>'
content = content.replace(old_hero, new_hero)

# Change [data-theme='dark'] product icons to gold
old_prod_icon = """        [data-theme='dark'] .product-tag {
            color: #A0B3C6 !important;
            border: 1px solid rgba(160, 179, 198, 0.2) !important;
            background: rgba(0, 78, 140, 0.15) !important;
        }"""
new_prod_icon = """        [data-theme='dark'] .product-tag {
            color: var(--gold) !important;
            border: 1px solid rgba(250, 204, 21, 0.3) !important;
            background: rgba(250, 204, 21, 0.1) !important;
        }"""
content = content.replace(old_prod_icon, new_prod_icon)

# Change featured product border glow to gold
old_feat_hover = """        [data-theme='dark'] .product-card.featured:hover {
            border-color: rgba(0, 150, 255, 0.6) !important;
            box-shadow: 
                0 32px 64px rgba(0, 78, 140, 0.5),
                0 0 30px rgba(0, 150, 255, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }"""
new_feat_hover = """        [data-theme='dark'] .product-card.featured:hover {
            border-color: rgba(250, 204, 21, 0.6) !important;
            box-shadow: 
                0 32px 64px rgba(250, 204, 21, 0.2),
                0 0 30px rgba(250, 204, 21, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }"""
content = content.replace(old_feat_hover, new_feat_hover)

with open('index.html', 'w') as f:
    f.write(content)

print("Replacement complete.")
