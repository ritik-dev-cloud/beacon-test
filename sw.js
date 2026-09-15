/* Wayfinding PWA service worker.
   HTML = network-first (always get the latest when online, fall back to cache offline).
   Static/CDN assets = cache-first (fast + offline). */
const CACHE = 'wayfinder-v2';
const SHELL = ['./app.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isDoc = req.mode === 'navigate' || req.url.endsWith('app.html') || req.url.endsWith('/');
  if (isDoc) {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
                .catch(() => caches.match(req).then(m => m || caches.match('./app.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const c = r.clone(); caches.open(CACHE).then(x => { try { x.put(req, c); } catch (_) {} });
      return r;
    }).catch(() => caches.match('./app.html')))
  );
});
