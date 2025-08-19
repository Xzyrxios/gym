// Enkel cache för offline-stöd
const CACHE_NAME = 'traning-v1';
const ASSETS = [
  './',
  './index.html',
  './stats.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
  // lägg till fler filer om du har (css, bilder etc)
];

// Installera och cacha
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Aktivera och städa gamla cache-versioner
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

// Nät först, annars cache fallback
self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    fetch(req).then(res => {
      // uppdatera cache i bakgrunden
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match('./')))
  );
});
