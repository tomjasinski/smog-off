// Prosty service worker (zastępuje next-pwa/workbox): cache kafelków i fontów mapy, zasobów aplikacji, danych API
// oraz odwiedzonych stron (żeby dało się je otworzyć bez internetu).
const API_CACHE = 'air-quality-api-v1';
const TILE_CACHE = 'ofm-tiles-v1';
const GLYPH_CACHE = 'ofm-glyphs-v1';
const STATIC_CACHE = 'next-static-v1';
const PAGES_CACHE = 'pages-v1';
const RUNTIME_CACHE = 'runtime-v1';
const KNOWN_CACHES = [API_CACHE, TILE_CACHE, GLYPH_CACHE, STATIC_CACHE, PAGES_CACHE, RUNTIME_CACHE];
const MAX_PAGES = 25;
const PAGE_TIMEOUT_MS = 6000;
// Pliki bez hasha w nazwie: sieć najpierw, a bez sieci kopia
const RUNTIME_PATHS = ['/maplibre-gl-worker.mjs', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];
const MAX_TILES = 600;
const MAX_STATIC = 120;
const API_TIMEOUT_MS = 10000;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

// Odpowiedź z cache dostaje nagłówek, po którym strona wie, że pokazuje zapisane dane (a nie świeże)
async function markFromCache(response) {
  const headers = new Headers(response.headers);
  headers.set('X-From-Cache', '1');
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

// Sieć najpierw, a przy braku sieci (lub po timeout) kopia z cache
async function networkFirst(request, cacheName = API_CACHE, timeoutMs = API_TIMEOUT_MS, max) {
  const cache = await caches.open(cacheName);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      if (max) trimCache(cacheName, max);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return markFromCache(cached);
    throw err;
  }
}

// Strona HTML: sieć najpierw, a bez sieci ta sama strona z cache albo strona główna
async function pageNetworkFirst(request) {
  try {
    return await networkFirst(request, PAGES_CACHE, PAGE_TIMEOUT_MS, MAX_PAGES);
  } catch (err) {
    const cache = await caches.open(PAGES_CACHE);
    const home = await cache.match('/');
    if (home) return home;
    throw err;
  }
}

// Cache najpierw: dla zasobów niezmiennych (adresy kafelków i plików mają wersję lub hash)
async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
    if (max) trimCache(cacheName, max);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/api/air-quality') {
      event.respondWith(networkFirst(request));
    } else if (request.mode === 'navigate') {
      event.respondWith(pageNetworkFirst(request));
    } else if (RUNTIME_PATHS.includes(url.pathname)) {
      event.respondWith(networkFirst(request, RUNTIME_CACHE));
    } else if (url.pathname.startsWith('/_next/static/')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE, MAX_STATIC));
    }
    return;
  }

  if (url.hostname === 'tiles.openfreemap.org') {
    if (url.pathname.startsWith('/planet/') && url.pathname.endsWith('.pbf')) {
      event.respondWith(cacheFirst(request, TILE_CACHE, MAX_TILES));
    } else if (url.pathname.startsWith('/fonts/')) {
      event.respondWith(cacheFirst(request, GLYPH_CACHE));
    } else if (url.pathname === '/planet') {
      // TileJSON wskazuje aktualną wersję kafelków, więc zawsze pytamy sieć
      event.respondWith(networkFirst(request));
    }
  }
});
