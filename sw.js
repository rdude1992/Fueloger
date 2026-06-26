// FuelLog Service Worker — network-first for HTML, cache-first for assets
// Bump CACHE_VERSION on every deploy to trigger update flow
const CACHE_VERSION = 'fuellog-v8';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;

// Relative paths — works whether deployed at root or under a sub-path
// (e.g. username.github.io/fuellog/). Absolute "/" paths break on sub-path hosts.
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// Offline OCR assets — cached on first use so receipt scanning works offline
// OpenCV.js (~8MB) for image enhancement, Tesseract.js for OCR
const OCR_ASSETS = [
  'https://docs.opencv.org/4.9.0/opencv.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm'
];

// When this SW installs, also try to cache OCR assets (best-effort, won't block install)
function cacheOcrAssets(cache) {
  return Promise.allSettled(
    OCR_ASSETS.map(url =>
      cache.add(url).catch(err => console.warn('[SW] Failed to cache OCR asset', url, err))
    )
  );
}

// ── MESSAGE: allow page to trigger skip-waiting ───────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── INSTALL: pre-cache static assets (resilient — one failure won't block install) ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      // Cache each asset individually so one 404 doesn't fail the whole install
      return Promise.all(
        STATIC_ASSETS.map(asset =>
          cache.add(asset).catch(err => console.warn('[SW] Failed to cache', asset, err))
        )
      );
    }).then(() => self.skipWaiting())
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
      .then(() => self.clients.claim())
      .then(() => {
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
  if (url.origin !== self.location.origin) return;

  const isHTML = e.request.destination === 'document'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html');

  if (isHTML) {
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
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
