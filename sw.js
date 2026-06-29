/* RMES Mobile service worker — NETWORK-FIRST.
   Always tries the network so a freshly published version is shown after reload;
   falls back to the last cached copy only when offline. */
const CACHE = 'rmes-mobile-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => { try { c.put(e.request, copy); } catch (_) {} });
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
