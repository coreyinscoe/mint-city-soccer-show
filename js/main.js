/* =============================================================
   Mint City Soccer Show — main.js
   ============================================================= */

const CONFIG = {
  rssUrl:        'https://anchor.fm/s/130854cc/podcast/rss',
  spotifyUrl:    'https://open.spotify.com/show/3G7vSeluPM2wcvdUrV3cjN',
  spotifyEmbed:  'https://open.spotify.com/embed/show/3G7vSeluPM2wcvdUrV3cjN?utm_source=generator&theme=0',
  episodeCount:  6,
  youtubeChannelId: 'UC8G83_vpTHZJVhCb7jYaIDw',
  youtubeUrl:    'https://www.youtube.com/@MintCitySoccerShow',
};

// ── Nav: scroll-based opacity ──────────────────────────────────
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── Mobile nav toggle ──────────────────────────────────────────
const navToggle = document.getElementById('nav-toggle');
const body = document.body;

navToggle.addEventListener('click', () => {
  const open = body.classList.toggle('nav-open');
  navToggle.setAttribute('aria-expanded', open);
});

document.querySelectorAll('#nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ── Footer year ────────────────────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Episode fetch & render ─────────────────────────────────────
async function loadEpisodes() {
  const grid = document.getElementById('episodes-grid');
  if (!grid) return;

  try {
    // Fetch RSS XML directly — Anchor/Spotify feeds allow cross-origin
    const res = await fetch(CONFIG.rssUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const doc  = new DOMParser().parseFromString(text, 'text/xml');

    if (doc.querySelector('parsererror')) throw new Error('XML parse error');

    const showImage = doc.querySelector('channel > image > url')?.textContent?.trim()
                   || doc.getElementsByTagName('itunes:image')[0]?.getAttribute('href')
                   || '';

    const items = Array.from(doc.querySelectorAll('item'))
                       .slice(0, CONFIG.episodeCount);

    if (!items.length) throw new Error('No episodes found');

    grid.innerHTML = items.map(item => renderCard(item, showImage)).join('');

  } catch (err) {
    console.warn('RSS fetch failed:', err.message);
    grid.innerHTML = fallbackEmbed();
  }
}

// ── XML helpers ────────────────────────────────────────────────
function tag(item, name) {
  return item.getElementsByTagName(name)[0]?.textContent?.trim() || '';
}
function attr(item, name, attribute) {
  return item.getElementsByTagName(name)[0]?.getAttribute(attribute) || '';
}

// ── Render one episode card ────────────────────────────────────
function renderCard(item, showImage) {
  const title    = tag(item, 'title');
  const rawDesc  = tag(item, 'description') || tag(item, 'content:encoded') || '';
  const desc     = stripHtml(rawDesc);
  const pubDate  = formatDate(tag(item, 'pubDate'));
  const duration = formatDuration(tag(item, 'itunes:duration'));
  const epNum    = tag(item, 'itunes:episode');
  const thumb    = attr(item, 'itunes:image', 'href') || showImage;
  const url      = tag(item, 'link') || attr(item, 'enclosure', 'url') || CONFIG.spotifyUrl;

  return `
    <article class="episode-card">
      ${thumb ? `<img class="episode-thumb" src="${escHtml(thumb)}" alt="${escHtml(title)}" loading="lazy">` : ''}
      <div class="episode-body">
        <div class="episode-meta">
          ${epNum ? `<span class="episode-num">EP. ${escHtml(epNum)}</span><span class="episode-sep"></span>` : ''}
          <span class="episode-date">${pubDate}</span>
        </div>
        <h3 class="episode-title">${escHtml(title)}</h3>
        <p class="episode-desc">${escHtml(desc)}</p>
        <div class="episode-footer">
          <a href="${escHtml(url)}" target="_blank" rel="noopener" class="episode-listen">
            Listen now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          ${duration ? `<span class="episode-duration">${duration}</span>` : ''}
        </div>
      </div>
    </article>`;
}

// ── Spotify embed fallback ─────────────────────────────────────
function fallbackEmbed() {
  return `
    <div style="grid-column:1/-1;">
      <iframe
        title="Mint City Soccer Show on Spotify"
        style="border-radius:8px;"
        src="${CONFIG.spotifyEmbed}"
        width="100%" height="352"
        frameborder="0" allowfullscreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy">
      </iframe>
    </div>`;
}

// ── Utility ────────────────────────────────────────────────────
function formatDate(pubDate) {
  if (!pubDate) return '';
  try {
    return new Date(pubDate).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

function formatDuration(raw) {
  if (!raw) return '';
  if (raw.includes(':')) {
    const parts = raw.split(':').map(Number);
    if (parts.length === 3) return parts[0] > 0 ? `${parts[0]}h ${parts[1]}m` : `${parts[1]}m`;
    if (parts.length === 2) return `${parts[0]}m`;
  }
  const s = parseInt(raw, 10);
  if (!isNaN(s)) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  return '';
}

function stripHtml(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// ── YouTube channel card ────────────────────────────────────────
function loadLatestVideo() {
  const container = document.getElementById('youtube-embed');
  if (!container) return;

  container.innerHTML = `
    <a href="${CONFIG.youtubeUrl}" target="_blank" rel="noopener"
       class="youtube-channel-card" aria-label="Watch Mint City Soccer Show on YouTube">
      <div class="yt-card-bg">
        <div class="yt-card-inner">
          <img src="images/logo.jpg" alt="Mint City Soccer Show" class="yt-card-logo">
          <div class="yt-card-play">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="yt-card-label">
        <span class="yt-handle">@MintCitySoccerShow</span>
        <span class="yt-cta">Watch on YouTube →</span>
      </div>
    </a>`;
}

// ── Init ───────────────────────────────────────────────────────
loadEpisodes();
loadLatestVideo();
