// FuelLog Service Worker — network-first for HTML, cache-first for assets
// Bump CACHE_VERSION on every deploy to trigger update flow
const CACHE_VERSION = 'fuellog-v14';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const OCR_LIB_CACHE = `${CACHE_VERSION}-ocr-libs`; // separate cache for big offline-OCR assets

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

// Cross-origin hosts that are allowed to be cached for full offline OCR support.
// Tesseract.js and OpenCV.js (and their WASM/traineddata files) load from these.
const OCR_ALLOWED_ORIGINS = [
  'https://cdn.jsdelivr.net',
  'https://docs.opencv.org',
  'https://tessdata.projectnaptha.com', // Tesseract's default language-data CDN
  'https://unpkg.com',
];

function isOCRLibRequest(url) {
  return OCR_ALLOWED_ORIGINS.some(origin => url.href.startsWith(origin));
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

// ── ACTIVATE: delete old STATIC caches only — OCR lib cache persists across
// versions since those libraries rarely change and are expensive to re-download ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== OCR_LIB_CACHE && !k.endsWith('-ocr-libs'))
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
// OCR libraries (Tesseract.js/OpenCV.js/WASM/traineddata) are cache-first and
// persist indefinitely once downloaded once — this is what makes OCR scanning
// work completely offline after the very first successful scan.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Cross-origin: only handle the allow-listed OCR library hosts, cache-first forever
  if (url.origin !== self.location.origin) {
    if (!isOCRLibRequest(url)) return; // let the browser handle all other cross-origin requests normally
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          // Cross-origin <script> tag fetches are typically "opaque" (status 0,
          // type 'opaque') due to no-cors mode — still valid to cache, just can't
          // inspect their actual status code.
          if (resp && (resp.status === 200 || resp.type === 'opaque')) {
            const clone = resp.clone();
            caches.open(OCR_LIB_CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => cached);
      })
    );
    return;
  }

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
