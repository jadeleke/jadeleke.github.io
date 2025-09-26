const CACHE_NAME = 'site-cache-v1';
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
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      return response;
    }).catch(() => cached))
  );
});
