const CACHE_NAME = 'site-cache-v21';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/blog/',
  '/blog/index.html',
  '/blog/posts/hello-mlops.html',
  '/blog/posts/devops-mlops-oracle-linux.html',
  '/resume.html',
  '/404.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Leave cross-origin requests (fonts, GitHub API, Supabase) to the browser
  if (new URL(request.url).origin !== self.location.origin) return;

  // Network-first for page navigations so deploys show up without a cache bump
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(request).then(cached => cached || caches.match('/404.html'))
      )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      }
      return response;
    }))
  );
});
