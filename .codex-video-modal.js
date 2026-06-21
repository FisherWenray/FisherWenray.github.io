const fs = require('fs');
const path = 'video.html';
let text = fs.readFileSync(path, 'utf8');

function between(startMarker, endMarker, replacement) {
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error('Start marker not found: ' + startMarker);
  const end = text.indexOf(endMarker, start);
  if (end === -1) throw new Error('End marker not found: ' + endMarker);
  text = text.slice(0, start) + replacement + text.slice(end);
}

between(
  `        .inline-player-note {`,
  `        .empty-list {`,
  `        .inline-player-note {
            color: var(--ink-soft);
            font-size: 14px;
            line-height: 1.7;
        }

        .inline-player-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .video-modal-trigger,
        .inline-secondary-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 16px;
            border-radius: 999px;
            border: 1px solid rgba(var(--primary-rgb), 0.16);
            background: rgba(var(--primary-rgb), 0.08);
            color: #00AEEC;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .video-modal-trigger:hover,
        .inline-secondary-link:hover {
            transform: translateY(-1px);
            border-color: rgba(0, 174, 236, 0.28);
            background: rgba(0, 174, 236, 0.12);
        }

        .video-modal-trigger {
            appearance: none;
            -webkit-appearance: none;
        }

        .player-modal {
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(4, 10, 20, 0.72);
            backdrop-filter: blur(12px);
            z-index: 2000;
        }

        .player-modal.is-open {
            display: flex;
        }

        .player-modal-dialog {
            width: min(1100px, 100%);
            display: grid;
            gap: 14px;
            padding: 18px;
            border-radius: 24px;
            border: 1px solid rgba(var(--primary-rgb), 0.18);
            background: rgba(255, 255, 255, 0.96);
            box-shadow: 0 28px 70px rgba(5, 16, 30, 0.28);
        }

        .player-modal-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .player-modal-title {
            min-width: 0;
            color: var(--ink);
            font-size: 18px;
            font-weight: 700;
            line-height: 1.5;
        }

        .player-modal-close {
            width: 42px;
            height: 42px;
            border: 0;
            border-radius: 999px;
            background: rgba(var(--primary-rgb), 0.1);
            color: var(--ink);
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s ease, transform 0.2s ease;
        }

        .player-modal-close:hover {
            background: rgba(var(--primary-rgb), 0.16);
            transform: rotate(90deg);
        }

        .player-modal-frame {
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(0, 174, 236, 0.16), rgba(0, 78, 140, 0.12));
            border: 1px solid rgba(var(--primary-rgb), 0.14);
        }

        .player-modal-frame iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
        }

        body.modal-open {
            overflow: hidden;
        }

`
);

between(
  `        @media (max-width: 760px) {`,
  `        [data-theme='dark'] {`,
  `        @media (max-width: 760px) {
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

            .player-modal {
                padding: 12px;
            }

            .player-modal-dialog {
                padding: 14px;
                border-radius: 18px;
            }

            .player-modal-top {
                align-items: flex-start;
            }

            .player-modal-title {
                font-size: 16px;
            }
        }
`
);

text = text.replace(
  `        let activeVideoIndex = null;`,
  `        let activeVideoIndex = null;
        let playerModal = null;
        let playerModalFrame = null;
        let playerModalTitle = null;`
);

between(
  `        function renderInlinePlayer(video) {`,
  `        function bindVideoSelection(videos) {`,
  `        function renderInlinePlayer(video, index) {
            const embedUrl = getEmbedUrl(video);
            const watchUrl = getWatchUrl(video);

            if (!embedUrl) {
                return \
                    \`
                    <div class="inline-player-shell">
                        <div class="inline-player-note">这条视频暂时没有可用的嵌入参数，你可以直接去 B 站原视频页观看。</div>
                        <div class="inline-player-actions">
                            <a class="hero-btn hero-btn-secondary inline-secondary-link" href="\${escapeHTML(watchUrl)}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i><span>打开原视频</span></a>
                        </div>
                    </div>
                \`;
            }

            return \
                \`
                <div class="inline-player-shell">
                    <div class="inline-player-frame">
                        <iframe src="\${escapeHTML(embedUrl)}" title="\${escapeHTML(video.title || '哔哩哔哩视频播放器')}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
                    </div>
                    <div class="inline-player-note">正在原地播放《\${escapeHTML(video.title || '未命名视频')}》。如果你想更舒服地看，可以直接放大播放；想看评论、收藏或弹幕细节，也可以打开原视频页。</div>
                    <div class="inline-player-actions">
                        <button type="button" class="video-modal-trigger" data-modal-index="\${index}"><i class="fas fa-expand"></i><span>放大播放</span></button>
                        <a class="inline-secondary-link" href="\${escapeHTML(watchUrl)}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square"></i><span>B 站原视频</span></a>
                    </div>
                </div>
            \`;
        }

`
);

between(
  `        function bindVideoSelection(videos) {`,
  `        function renderList(videos) {`,
  `        function bindVideoSelection(videos) {
            videoList.querySelectorAll('.video-item').forEach((item) => {
                const activate = () => {
                    const index = Number(item.dataset.index || 0);
                    activeVideoIndex = activeVideoIndex === index ? null : index;
                    renderList(videos);
                };

                item.addEventListener('click', (event) => {
                    if (event.target.closest('a, button')) return;
                    activate();
                });
                item.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        activate();
                    }
                });
            });

            videoList.querySelectorAll('.video-modal-trigger').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const index = Number(button.dataset.modalIndex || 0);
                    openPlayerModal(videos[index]);
                });
            });

            videoList.querySelectorAll('a, button').forEach((element) => {
                element.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
            });
        }

        function ensurePlayerModal() {
            if (playerModal) return;

            const shell = document.createElement('div');
            shell.className = 'player-modal';
            shell.innerHTML = \
                \`
                <div class="player-modal-dialog" role="dialog" aria-modal="true" aria-label="放大视频播放器">
                    <div class="player-modal-top">
                        <div class="player-modal-title"></div>
                        <button type="button" class="player-modal-close" aria-label="关闭放大播放器">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                    <div class="player-modal-frame">
                        <iframe src="about:blank" title="放大视频播放器" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
                    </div>
                </div>
            \`;

            document.body.appendChild(shell);
            playerModal = shell;
            playerModalFrame = shell.querySelector('iframe');
            playerModalTitle = shell.querySelector('.player-modal-title');

            shell.addEventListener('click', (event) => {
                if (event.target === shell) {
                    closePlayerModal();
                }
            });

            shell.querySelector('.player-modal-close').addEventListener('click', () => {
                closePlayerModal();
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && playerModal?.classList.contains('is-open')) {
                    closePlayerModal();
                }
            });
        }

        function openPlayerModal(video) {
            if (!video) return;
            const embedUrl = getEmbedUrl(video);

            if (!embedUrl) {
                window.open(getWatchUrl(video), '_blank', 'noopener');
                return;
            }

            ensurePlayerModal();
            playerModalTitle.textContent = video.title || '未命名视频';
            playerModalFrame.src = embedUrl;
            playerModal.classList.add('is-open');
            document.body.classList.add('modal-open');
        }

        function closePlayerModal() {
            if (!playerModal) return;
            playerModal.classList.remove('is-open');
            document.body.classList.remove('modal-open');
            if (playerModalFrame) {
                playerModalFrame.src = 'about:blank';
            }
        }

        function renderList(videos) {
`
);

text = text.replace(`renderInlinePlayer(video)`, `renderInlinePlayer(video, index)`);
text = text.replace(`        loadBilibiliVideos();`, `        ensurePlayerModal();\n        loadBilibiliVideos();`);

fs.writeFileSync(path, text, 'utf8');
