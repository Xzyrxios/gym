// Service Worker – fresh HTML (network-first) + immediate activation
// Version bump this when you deploy changes
const CACHE_NAME = 'traning-v3-2025-09-16';

// Precache only static assets that rarely change (NOT html)
const ASSETS = [
  './',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate new SW immediately
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim(); // take control of uncontrolled clients
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    // Don’t try to cache non-GET requests
    return event.respondWith(fetch(req));
  }

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    // Network-first for HTML to ensure freshest pages (stats.html, index.html)
    return event.respondWith((async () => {
      try {
        const fresh = await fetch(new Request(req.url, { cache: 'no-store' }));
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        return cached || cache.match('./');
      }
    })());
  }

  // For non-HTML: cache-first with network fallback + background refresh
  return event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) {
      // Update in background
      fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone()).catch(()=>{});
      }).catch(()=>{});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone()).catch(()=>{});
      return res;
    } catch {
      // last resort: try fallback to app shell if root request
      return cache.match('./');
    }
  })());
});
