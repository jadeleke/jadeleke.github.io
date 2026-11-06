// Only this site's public, versioned assets belong in this cache.
const CACHE_PREFIX = 'jadeleke-site-';
const ASSET_VERSION = '20261106-2';
const CACHE_NAME = `${CACHE_PREFIX}v26`;
const LEGACY_CACHES = new Set(['site-cache-v21', 'site-cache-v22', 'site-cache-v23', 'site-cache-v24']);
const ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/research.html',
  '/experience.html',
  '/education.html',
  '/certificates.html',
  '/projects.html',
  '/openmed.html',
  '/featured.html',
  '/skills.html',
  '/contact.html',
  '/resume.html',
  '/404.html',
  '/css/main.css',
  '/css/projects.css',
  '/js/main.js',
  '/js/theme.js',
  '/js/animation.js',
  '/js/resume.js',
  '/blog/',
  '/blog/index.html',
  '/blog/blog.css',
  '/blog/posts/hello-mlops.html',
  '/blog/posts/devops-mlops-oracle-linux.html',
  '/data/featured.json',
  '/data/repos-cache.json',
  '/data/repos-cache-meta.json',
  '/assets/favicon.svg',
  '/assets/joseph-adeleke.jpg',
  '/assets/Joseph-Adeleke-current.pdf'
];
const PUBLIC_PAGES = new Set(ASSETS.filter(path => path.endsWith('.html') || path.endsWith('/')));
const DATA_FILES = new Set(['/data/featured.json', '/data/repos-cache.json', '/data/repos-cache-meta.json']);
const STATIC_FILES = new Set(ASSETS.filter(path => !PUBLIC_PAGES.has(path) && !DATA_FILES.has(path)));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key !== CACHE_NAME && (key.startsWith(CACHE_PREFIX) || LEGACY_CACHES.has(key)))
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function store(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (_) { /* A full or unavailable cache must not break an online response. */ }
}

async function cached(request) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(request);
}

async function unavailablePage() {
  const fallback = await cached('/404.html');
  return new Response(fallback ? await fallback.blob() : 'This page is unavailable offline.', {
    status: 404,
    statusText: 'Not Found',
    headers: { 'Content-Type': fallback?.headers.get('Content-Type') || 'text/plain; charset=utf-8' }
  });
}

async function publicNavigation(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok && PUBLIC_PAGES.has(url.pathname) && !url.search) await store(request, response);
    return response;
  } catch (_) {
    const response = PUBLIC_PAGES.has(url.pathname) && !url.search ? await cached(request) : null;
    return response || unavailablePage();
  }
}

async function currentData(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(request, { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error('Data unavailable');
    // Never replace a valid cached JSON response with an HTML error page.
    await response.clone().json();
    await store(request, response);
    return response;
  } catch (_) {
    return await cached(request) || new Response('[]', { status: 503, headers: { 'Content-Type': 'application/json' } });
  } finally { clearTimeout(timeout); }
}

async function staticFile(request, url) {
  // The base precache belongs to this release. It may satisfy this release's
  // versioned URLs on an unvisited page, but never a different deployment.
  if (!url.search || url.searchParams.get('v') === ASSET_VERSION) {
    const existing = await cached(request) || (url.search ? await cached(url.origin + url.pathname) : null);
    if (existing) return existing;
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) await store(request, response);
    return response;
  }
  // A newer HTML document may arrive while an older worker still controls it.
  // Always revalidate a different asset version; an exact match alone is a safe offline fallback.
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) await store(request, response);
    return response;
  } catch (_) {
    return await cached(request) || new Response('This asset version is unavailable offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Publishing and per-post pages are online-only; no private or query-keyed state is retained.
  if (url.pathname === '/blog/admin.html' || url.pathname === '/blog/post.html') return;
  if (request.mode === 'navigate') {
    event.respondWith(publicNavigation(request, url));
  } else if (DATA_FILES.has(url.pathname) && !url.search) {
    event.respondWith(currentData(request));
  } else if (STATIC_FILES.has(url.pathname)) {
    event.respondWith(staticFile(request, url));
  }
  // Unrecognised requests pass through; API responses and arbitrary URLs are never cached.
});
