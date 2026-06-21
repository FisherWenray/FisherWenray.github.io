const fs = require('fs');
const path = 'video.html';
let text = fs.readFileSync(path, 'utf8');

const styleStart = text.indexOf(`        .video-list {`);
const darkStart = text.indexOf(`        [data-theme='dark'] {`);
if (styleStart === -1 || darkStart === -1 || darkStart <= styleStart) {
  throw new Error('Style block not found');
}
const newStyle = `        .video-list {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            align-items: start;
        }

        .video-item {
            display: grid;
            gap: 14px;
            padding: 14px;
            border-radius: 18px;
            border: 1px solid rgba(var(--primary-rgb), 0.1);
            background: rgba(255, 255, 255, 0.58);
            transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
            align-content: start;
        }

        .video-item:hover {
            transform: translateY(-3px);
            border-color: rgba(0, 174, 236, 0.28);
            background: rgba(255, 255, 255, 0.82);
            box-shadow: 0 16px 30px rgba(0, 78, 140, 0.08);
        }

        .video-item.is-active {
            border-color: rgba(0, 174, 236, 0.42);
            box-shadow: 0 14px 30px rgba(0, 118, 163, 0.16);
            background: rgba(0, 174, 236, 0.08);
        }

        .video-item:focus-visible {
            outline: 2px solid rgba(0, 174, 236, 0.55);
            outline-offset: 2px;
        }

        .video-summary-row {
            display: grid;
            gap: 14px;
            align-content: start;
        }

        .video-thumb-wrap {
            position: relative;
        }

        .video-thumb {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 14px;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(0, 174, 236, 0.16), rgba(0, 78, 140, 0.2));
            border: 1px solid rgba(var(--primary-rgb), 0.12);
        }

        .video-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .video-thumb-placeholder {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: #00AEEC;
            font-size: 32px;
        }

        .video-duration-badge {
            position: absolute;
            right: 10px;
            bottom: 10px;
            padding: 4px 8px;
            border-radius: 999px;
            background: rgba(5, 10, 18, 0.78);
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
            backdrop-filter: blur(8px);
        }

        .video-body {
            min-width: 0;
            display: grid;
            gap: 8px;
            align-content: start;
        }

        .video-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            color: var(--ink-soft);
            font-size: 12px;
        }

        .video-name {
            color: var(--ink);
            font-size: 18px;
            font-weight: 700;
            line-height: 1.5;
        }

        .video-summary {
            color: var(--ink-soft);
            font-size: 14px;
            line-height: 1.75;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .video-links {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 2px;
        }

        .video-link,
        .video-inline-trigger {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #00AEEC;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
        }

        .inline-player-shell {
            display: none;
            gap: 14px;
            padding-top: 2px;
        }

        .video-item.is-active .inline-player-shell {
            display: grid;
        }

        .inline-player-frame {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(0, 174, 236, 0.16), rgba(0, 78, 140, 0.12));
            border: 1px solid rgba(var(--primary-rgb), 0.14);
        }

        .inline-player-frame iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
        }

        .inline-player-note {
            color: var(--ink-soft);
            font-size: 14px;
            line-height: 1.7;
        }

        .empty-list {
            padding: 24px;
            border-radius: 16px;
            border: 1px dashed rgba(var(--primary-rgb), 0.18);
            background: rgba(255, 255, 255, 0.42);
            color: var(--ink-soft);
            font-size: 14px;
            line-height: 1.8;
        }

        @media (max-width: 1100px) {
            .video-list {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 760px) {
            .container {
                gap: 18px;
            }

            .header {
                min-height: 0;
            }

            .header-top,
            .header-content {
                flex-direction: column;
            }

            .header-title,
            .header-content p {
                white-space: normal;
            }

            .video-list {
                grid-template-columns: 1fr;
            }
        }
`;
text = text.slice(0, styleStart) + newStyle + text.slice(darkStart);

const renderStart = text.indexOf(`        function renderList(videos) {`);
const loadStart = text.indexOf(`        async function loadBilibiliVideos() {`);
if (renderStart === -1 || loadStart === -1 || loadStart <= renderStart) {
  throw new Error('renderList block not found');
}
const newRender = `        function renderList(videos) {
            if (!videos.length) {
                videoCountNote.textContent = '0 条视频';
                videoList.innerHTML = \
                    \`\n                    <div class="empty-list">\n                        当前还没有配置可展示的视频条目。你可以继续把 B 站视频的 <code>title / bvid / cid / summary</code> 填进 <code>bilibili-videos.json</code>，页面就会自动显示。\n                    </div>\n                \`;
                return;
            }

            videoCountNote.textContent = \`\${videos.length} 条视频\`;

            videoList.innerHTML = videos.map((video, index) => {
                const isActive = activeVideoIndex === index;
                const watchUrl = getWatchUrl(video);
                const cover = video.cover
                    ? \`<img src="\${escapeHTML(video.cover)}" alt="\${escapeHTML(video.title || '视频封面')}" loading="lazy" decoding="async">\`
                    : \`<div class="video-thumb-placeholder"><i class="fab fa-bilibili"></i></div>\`;
                const metaBits = [video.publishedAt].filter(Boolean)
                    .map((item) => \`<span>\${escapeHTML(item)}</span>\`)
                    .join('');
                const durationBadge = video.duration
                    ? \`<span class="video-duration-badge">\${escapeHTML(video.duration)}</span>\`
                    : '';

                return \`
                    <article class="video-item\${isActive ? ' is-active' : ''}" data-index="\${index}" role="button" tabindex="0" aria-expanded="\${isActive ? 'true' : 'false'}" aria-label="播放 \${escapeHTML(video.title || '未命名视频')}">
                        <div class="video-summary-row">
                            <span class="video-thumb-wrap">
                                <span class="video-thumb">\${cover}</span>
                                \${durationBadge}
                            </span>
                            <span class="video-body">
                                <span class="video-meta">\${metaBits || '<span>最近更新</span>'}</span>
                                <span class="video-name">\${escapeHTML(video.title || '未命名视频')}</span>
                                <span class="video-summary">\${escapeHTML(video.summary || '这条视频暂时还没有补充简介。')}</span>
                                <span class="video-links">
                                    <span class="video-inline-trigger"><i class="fas fa-play-circle"></i><span>\${isActive ? '收起播放器' : '原地播放'}</span></span>
                                    <a class="video-link" href="\${escapeHTML(watchUrl)}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i><span>B 站原视频</span></a>
                                </span>
                            </span>
                        </div>
                        \${isActive ? renderInlinePlayer(video) : ''}
                    </article>
                \`;
            }).join('');

            bindVideoSelection(videos);
        }

`;
text = text.slice(0, renderStart) + newRender + text.slice(loadStart);

fs.writeFileSync(path, text, 'utf8');
