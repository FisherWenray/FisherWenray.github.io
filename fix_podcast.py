import re

with open('podcast.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add APlayer links to head
aplayer_links = """    <!-- 引入 APlayer -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
    <script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>"""

if 'APlayer.min.js' not in content:
    content = content.replace('    <link\n        href="https://fonts.googleapis.com/css2?', aplayer_links + '\n    <link\n        href="https://fonts.googleapis.com/css2?')

# 2. Add APlayer CSS
aplayer_css = """        /* 自定义 APlayer 样式 */
        .podcast-player-card {
            background: var(--surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            padding: 20px;
            margin-bottom: 20px;
        }

        .aplayer {
            border-radius: var(--radius-md) !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
            border: 1px solid var(--line) !important;
            background: rgba(255, 255, 255, 0.95) !important;
        }

        .aplayer .aplayer-info {
            padding: 14px 15px !important;
        }

        .aplayer .aplayer-pic {
            position: relative !important;
        }

        .aplayer .aplayer-pic .aplayer-button {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            right: auto !important;
            bottom: auto !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
        }"""

# Remove .mini-player CSS and body.player-active
content = re.sub(r'\s*\.mini-player \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-player-inner \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-progress-track \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#progressBar \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-main \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-info \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-icon \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-text \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-title \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-sub \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-controls \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.icon-btn \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.icon-btn:hover \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.icon-btn\.primary \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.icon-btn\.primary:hover \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.mini-actions \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*\.speed-wrap \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#speedBtn \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#speedBtn:hover \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#speedMenu \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#speedMenu \[data-speed\] \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#speedMenu \[data-speed\]:hover \{[\s\S]*?\}\s*', '\n', content)
content = re.sub(r'\s*#volumeSlider \{[\s\S]*?\}\s*', '\n', content)

# Update some media queries leftovers for mini-player
content = re.sub(r'\s*\.mini-main \{[^}]*\}\s*\.mini-actions \{[^}]*\}', '', content)
content = re.sub(r'\s*\.mini-player-inner \{[^}]*\}', '', content)
content = re.sub(r'\s*#volumeSlider \{[^}]*\}', '', content)
content = re.sub(r'\s*body\.player-active \{[^}]*\}', '', content)

if '.podcast-player-card' not in content:
    content = content.replace('</style>', aplayer_css + '\n    </style>')

# 3. HTML Changes
# Remove miniPlayer HTML
content = re.sub(r'<div id="miniPlayer" class="mini-player">[\s\S]*?<audio id="audioPlayer" style="display: none;">您的浏览器不支持音频播放</audio>\s*</div>', '', content)

# Add APlayer card above podcast-shell
aplayer_html = """
        <div class="podcast-player-card" id="playerCard" style="display: none;">
            <div id="aplayer"></div>
        </div>
"""
if 'id="playerCard"' not in content:
    content = content.replace('<div class="podcast-shell">', aplayer_html + '\n        <div class="podcast-shell">')

# 4. JS Changes
# Cover URL
content = content.replace("url.replace(/100x100/, '200x200')", "url.replace(/100x100/, '600x600')")

# playEpisode rewrite
old_playEpisode = r"function playEpisode\(episodeIndex\) \{[\s\S]*?\}\s*// 更新播放按钮状态"
new_playEpisode = """function playEpisode(episodeIndex) {
            const episode = filteredEpisodes[episodeIndex];
            if (!episode) return;

            trackEvent('podcast_play_click', {
                episode_id: episode.id,
                platform: episode.platform
            });

            currentPlayer = episode;

            if (!episode.audioUrl) {
                console.warn('该剧集没有音频 URL:', episode.title);
                alert('该剧集暂无音频');
                return;
            }

            if (!window.ap) {
                document.getElementById('playerCard').style.display = 'block';
                window.ap = new APlayer({
                    container: document.getElementById('aplayer'),
                    theme: '#5D7B93',
                    audio: [{
                        name: episode.title,
                        artist: episode.platformName || '播客',
                        url: episode.audioUrl,
                        cover: episode.coverUrl
                    }]
                });
                window.ap.play();
            } else {
                window.ap.pause();
                window.ap.list.clear();
                window.ap.list.add([{
                    name: episode.title,
                    artist: episode.platformName || '播客',
                    url: episode.audioUrl,
                    cover: episode.coverUrl
                }]);
                window.ap.list.switch(0);
                setTimeout(() => window.ap.play(), 50);
            }
        }

        // 更新播放按钮状态"""
content = re.sub(old_playEpisode, new_playEpisode, content)

# Remove unused JS functions
content = re.sub(r'// 更新播放按钮状态\s*function updatePlayButton\(\) \{[\s\S]*?\}', '', content)
content = re.sub(r'// 更新进度条\s*function updateProgress\(\) \{[\s\S]*?\}', '', content)
content = re.sub(r'// 格式化时间显示\s*function formatTime\(seconds\) \{[\s\S]*?\}', '', content)
content = re.sub(r'// 关闭迷你播放器\s*function closeMiniPlayer\(\) \{[\s\S]*?\}', '', content)

# Remove DOMContentLoaded for play controls
dom_loaded_regex = r'// 播放/暂停\s*document\.addEventListener\(\'DOMContentLoaded\', function \(\) \{[\s\S]*?// 日期格式化'
content = re.sub(dom_loaded_regex, '// 日期格式化', content)

with open('podcast.html', 'w', encoding='utf-8') as f:
    f.write(content)

