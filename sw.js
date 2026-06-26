// FuelLog Service Worker — network-first for HTML, cache-first for assets
// Bump CACHE_VERSION on every deploy to trigger update flow
const CACHE_VERSION = 'fuellog-v2';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ── MESSAGE: allow page to trigger skip-waiting ───────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── INSTALL: pre-cache all static assets ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// ── ACTIVATE: delete ALL old caches, claim clients ────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of open tabs
      .then(() => {
        // Tell every open tab: "new version is active, safe to reload"
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

// ── FETCH: network-first for HTML, cache-first for everything else ─
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin

  const isHTML = e.request.destination === 'document'
    || url.pathname === '/'
    || url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first: always try to get fresh HTML, fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first: serve assets instantly, update cache in background
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        });
        return cached || networkFetch;
      })
    );
  }
});
