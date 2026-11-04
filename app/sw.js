// Service worker : tout le contenu est mis en cache à l'installation, pour jouer sans réseau.
const VERSION = '__VERSION__';
const FICHIERS = __FICHIERS__;
const CACHE = `arrets-${VERSION}`;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'activer') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cible = e.request.mode === 'navigate' ? './' : e.request;
    const trouve = await cache.match(cible, { ignoreSearch: true });
    if (trouve) return trouve;
    try { return await fetch(e.request); } catch { return (await cache.match('./')) || Response.error(); }
  })());
});

self.addEventListener('push', (e) => {
  let d = { title: 'Ta série t’attend', body: 'Une séance aujourd’hui, et ton sceau reste en place.' };
  try { d = { ...d, ...e.data.json() }; } catch { /* message par défaut */ }
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'rappel-du-jour' }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ouverts = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (ouverts.length) return ouverts[0].focus();
    return self.clients.openWindow('./');
  })());
});
