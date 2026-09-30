// Stundenverlauf · Service Worker — offline nach dem ersten Laden (Muster: Kladde-SW)
// CACHE_NAME ist versioniert: = APP_VERSION (js/stunde.mjs) = ?v= (index.html); die Probe prüft die Gleichheit.
// Neuer CACHE_NAME → frischer Cache, addAll holt alles neu; fehlt eine Datei, bricht der Install ab (alter Stand bleibt).

const CACHE_NAME = 'stunde-v2.0.0';
const CACHE_FAMILIE = CACHE_NAME.slice(0, CACHE_NAME.lastIndexOf('-v') + 2);

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './css/stunde.css?v=2.0.0',
  './js/stunde.mjs?v=2.0.0',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache:'reload' — sonst kann index.html aus dem HTTP-Cache kommen (Pages ~10 min) und alt im Offline-Cache landen
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_FAMILIE) && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Seite selbst: erst Netz (damit ein Update ankommt), offline aus dem Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((antwort) => {
        if (antwort && antwort.status === 200) {
          const kopie = antwort.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, kopie));
        }
        return antwort;
      }).catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }
  // Dateien: aus dem Cache (sie tragen ?v=), sonst Netz
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((treffer) => treffer || fetch(event.request))
  );
});
