// Service worker: keeps every file of the app in a cache so it opens without internet.
// When you publish changes, raise VERSION so phones drop the old copy.
const VERSION = 'todo-v1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'fonts/fonts.css',
  'fonts/bricolage-latin.woff2',
  'fonts/bricolage-latin-ext.woff2',
  'fonts/figtree-latin.woff2',
  'fonts/figtree-latin-ext.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-120.png',
  'icons/icon-152.png',
  'icons/icon-167.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon-32.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Answer from the cache at once; refresh the cached copy in the background when online,
// so a newly published version shows up the next time the app is opened.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      const res = await network;
      if (res) return res;
      if (req.mode === 'navigate') return cache.match('index.html');
      return Response.error();
    })
  );
});
