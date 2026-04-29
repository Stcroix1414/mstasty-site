// ═══════════════════════════════════════════════
//  CONFIG
//  Once Cloudflare Tunnel is set up, update BOT_API
//  to your tunnel URL, e.g. https://api.mstasty.live
// ═══════════════════════════════════════════════
const BOT_API = 'https://api.mstasty.live';

// ═══════════════════════════════════════════════
//  NAV — scroll + mobile
// ═══════════════════════════════════════════════
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close on link click (mobile)
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ═══════════════════════════════════════════════
//  SMOOTH ANCHOR SCROLL
// ═══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ═══════════════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target); // fire once
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ═══════════════════════════════════════════════
//  LIVE STATS
// ═══════════════════════════════════════════════
const liveBadge  = document.getElementById('live-badge');
const liveText   = document.getElementById('live-text');
const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function applyState(data) {
  const live = data.stream_uptime && data.stream_uptime !== 'Not live';

  // Hero badge
  if (liveBadge) {
    liveBadge.className = `live-badge ${live ? 'is-live' : 'is-offline'}`;
  }
  if (liveText) liveText.textContent = live ? '🔴 LIVE NOW' : 'OFFLINE';

  // Stats section indicator
  if (statusDot)  statusDot.className  = `status-dot ${live ? 'live' : 'offline'}`;
  if (statusText) statusText.textContent = live
    ? '🔴 MsTasty is live — updating every 30s'
    : '⚫ Offline — stats from last session';

  // Stat cards
  setVal('stat-deaths',   data.deaths  ?? '—');
  setVal('stat-rank',     data.rank    || '—');
  setVal('stat-lp',       data.lp !== undefined
    ? `${data.lp > 0 ? '+' : ''}${data.lp} LP`
    : '—');
  setVal('stat-uptime',   data.stream_uptime || 'Offline');
  setVal('stat-chatters', data.chatters ?? '—');
  setVal('stat-game',     data.comp    || '—');
}

function setUnreachable() {
  if (liveBadge) liveBadge.className = 'live-badge is-offline';
  if (liveText)  liveText.textContent = 'OFFLINE';
  if (statusDot)  statusDot.className  = 'status-dot offline';
  if (statusText) statusText.textContent = '⚫ Bot unreachable';
  ['stat-deaths','stat-rank','stat-lp','stat-uptime','stat-chatters','stat-game']
    .forEach(id => setVal(id, '—'));
}

async function fetchStats() {
  try {
    const res = await fetch(`${BOT_API}/api/state`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error('non-200');
    applyState(await res.json());
  } catch {
    setUnreachable();
  }
}

fetchStats();
setInterval(fetchStats, 30_000);

// ═══════════════════════════════════════════════
//  BLOG — load recent posts from posts.json
// ═══════════════════════════════════════════════
const blogGrid  = document.getElementById('blog-grid');
const blogEmpty = document.getElementById('blog-empty');
const blogCta   = document.getElementById('blog-cta');

async function loadBlogPosts() {
  if (!blogGrid) return;
  try {
    const res = await fetch('posts.json');
    if (!res.ok) throw new Error('no posts.json');
    const posts = await res.json(); // array of post objects

    if (!posts.length) {
      if (blogEmpty) blogEmpty.style.display = 'block';
      return;
    }

    // Show max 3 on home page
    const recent = posts.slice(0, 3);
    recent.forEach((post, i) => {
      const card = buildBlogCard(post);
      card.classList.add('reveal', `reveal-delay-${i + 1}`);
      blogGrid.appendChild(card);
      revealObserver.observe(card);
    });

    if (posts.length > 3 && blogCta) {
      blogCta.style.display = 'block';
    }
  } catch {
    if (blogEmpty) blogEmpty.style.display = 'block';
  }
}

function buildBlogCard(post) {
  const a = document.createElement('a');
  a.href = `posts/${post.slug}.html`;
  a.className = 'blog-card';
  a.innerHTML = `
    <div class="blog-card-header">
      ${post.tag ? `<span class="blog-tag">${post.tag}</span>` : ''}
      <div class="blog-card-title">${post.title}</div>
    </div>
    <p class="blog-card-excerpt">${post.excerpt}</p>
    <div class="blog-card-footer">
      <span>${post.date}</span>
      <span class="blog-read-more">Read →</span>
    </div>
  `;
  return a;
}

loadBlogPosts();
