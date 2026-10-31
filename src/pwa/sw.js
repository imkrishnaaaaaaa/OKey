/**
 * OKey PWA — Service worker (offline app shell)
 *
 * Cache-first for the app shell so OKey opens and the local vault works fully
 * offline. Requests to other origins (Firebase, Google) always go to the
 * network and are never cached.
 */

// build.mjs replaces __BUILD_ID__ with a hash of the built files. Any change to
// the app gives a new cache name, so installed copies cannot stay on old code.
// ('dev' only appears when this file runs without the build.)
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const CACHE = `okey-shell-${BUILD_ID}`;
const SHELL = [
  './',
  './index.html',
  './app.js',
  './app.css',
  './manifest.webmanifest',
  './styles/nebula/tokens.css',
  './styles/nebula/aurora.css',
  './styles/nebula/components.css',
  './styles/nebula/motion.css',
  './styles/nebula/showpiece.css',
  './styles/nebula/screens.css',
  './fonts/Nunito-var-latin.woff2',
  './fonts/Inter-var-latin.woff2',
  './fonts/JetBrainsMono-var-latin.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache, so a new release is never
  // filled from a stale copy of the old files.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html')),
    ),
  );
});
