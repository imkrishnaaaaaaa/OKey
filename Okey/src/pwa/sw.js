/**
 * OKey PWA — Service worker (offline app shell)
 *
 * Cache-first for the app shell so OKey opens and the local vault works fully
 * offline. Sync requests (to script.google.com) always go to the network and
 * are never cached.
 */

const CACHE = 'okey-shell-v1';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './app.css',
  './manifest.webmanifest',
  './styles/design-tokens.css',
  './styles/components.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Never cache cross-origin (sync / Google) requests.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html')),
    ),
  );
});
