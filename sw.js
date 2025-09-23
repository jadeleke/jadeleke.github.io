const VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${VERSION}`;
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/assets/favicon.svg',
  '/assets/avatar.png',
  '/assets/project-default.svg',
  '/blog/',
  '/blog/index.html',
  '/blog/post.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Network-first for navigation requests; cache-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached))
    );
  }
});

