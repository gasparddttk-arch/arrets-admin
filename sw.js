// Dernière version de l'ancienne adresse : Gdroit a déménagé sur https://gdroit.eu.
// Ce service worker remplace l'ancien, efface sa copie de l'appli et ne sert plus que la page de déménagement.
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open('demenagement-1').then((c) => c.addAll([new Request('./', { cache: 'reload' })]))); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== 'demenagement-1') await caches.delete(k);
    await self.clients.claim();
    // Les fenêtres encore ouvertes sur l'ancienne appli passent tout de suite à la page de déménagement.
    for (const c of await self.clients.matchAll({ type: 'window' })) { try { await c.navigate('./'); } catch { /* fenêtre déjà fermée */ } }
  })());
});
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(async () => (await caches.match('./')) || Response.error()));
});
