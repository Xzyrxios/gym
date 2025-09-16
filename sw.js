// sw.js — minimal och säker
const CACHE_NAME = 'traning-v5-2025-09-16';
const ASSETS = [
  // Lägg bara filer här som verkligen finns!
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(ASSETS);
    } catch (e) {
      // Om någon fil saknas (404) vill vi INTE krascha installationen
      // därför ignorerar vi fel här.
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    return; // släpp igenom POST/PUT etc till nätet
  }

  // Cachade ASSETS: cache-first
  const url = new URL(req.url);
  const isSameOrigin = url.origin === location.origin;
  const isAsset = isSameOrigin && ASSETS.some(p => url.pathname.endsWith(p.replace('./','/')));

  if (isAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        // tyst bakgrundsuppdatering
        fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); }).catch(()=>{});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Allt annat: direkt nätverk (ingen HTML-cache)
  // (Network-first utan att spara i Cache)
  event.respondWith(fetch(req).catch(() => new Response('', { status: 504, statusText: 'Offline' })));
});
