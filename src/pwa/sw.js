/**
 * OKey PWA — Service worker (offline app shell)
 *
 * Cache-first for the app shell so OKey opens and the local vault works fully
 * offline. Sync requests (to script.google.com) always go to the network and
 * are never cached.
 */

import { APP } from '../core/constants.js';

// Cache name stamped with app version so every release busts the shell cache.
const CACHE = `okey-shell-${APP.VERSION}`;
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
