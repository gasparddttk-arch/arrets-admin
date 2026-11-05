// Service worker : tout le contenu est mis en cache à l'installation, pour jouer sans réseau.
const VERSION = 'bfa6ce08b41a';
const FICHIERS = ["./","content.json","css/app.css","fonts/garamond-400.woff2","fonts/garamond-500.woff2","fonts/garamond-500i.woff2","fonts/garamond-600.woff2","fonts/garamond-700.woff2","fonts/garamond-700i.woff2","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable.png","img/canette.svg","js/cloud.js","js/config.js","js/engine.js","js/games.js","js/images.js","js/main.js","js/notif.js","js/sons.js","js/state.js","js/ui.js","js/visuels.js","manifest.webmanifest"];
const CACHE = `arrets-${VERSION}`;

self.addEventListener('install', (e) => {
  // GitHub Pages garde ses fichiers dix minutes en cache : on exige les versions fraîches.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))));
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

// La série vit sur le téléphone : le service worker la lit dans la copie IndexedDB.
async function lireSerie() {
  const lecture = (async () => {
    const db = await new Promise((ok, ko) => {
      const r = indexedDB.open('arrets-admin', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
    });
    const brut = await new Promise((ok) => {
      const r = db.transaction('kv').objectStore('kv').get('arrets-admin.v1');
      r.onsuccess = () => ok(r.result); r.onerror = () => ok(null);
    });
    db.close();
    return brut ? JSON.parse(brut).serie : null;
  })().catch(() => null);
  // iOS exige une notification à chaque envoi : on n'attend jamais la lecture longtemps.
  return Promise.race([lecture, new Promise((ok) => setTimeout(() => ok(null), 800))]);
}

function jourParis() {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [a, m, j] = s.split('-').map(Number);
  return Math.floor(Date.UTC(a, m - 1, j) / 864e5);
}

self.addEventListener('push', (e) => {
  let d = { title: 'Ta série t’attend', body: 'Une séance aujourd’hui, et ton sceau reste en place.', question: '' };
  try { d = { ...d, ...e.data.json() }; } catch { /* message par défaut */ }
  e.waitUntil((async () => {
    const s = await lireSerie();
    let { title, body } = d;
    if (s?.dernier === jourParis()) {
      title = s.n > 1 ? `${s.n} jours de série, sceau posé` : 'Sceau posé pour aujourd’hui';
      body = d.question || 'Ta séance du jour est déjà validée.';
    } else if (s?.n > 1) {
      title = s.dernier < jourParis() - 1 ? `Ta série de ${s.n} jours vacille` : `${s.n} jours de série à défendre`;
    }
    await self.registration.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'rappel-du-jour' });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ouverts = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (ouverts.length) return ouverts[0].focus();
    return self.clients.openWindow('./');
  })());
});
