// Stundenverlauf · Service Worker — offline nach dem ersten Laden (Muster: Kladde-SW)
// CACHE_NAME ist versioniert: = APP_VERSION (js/stunde.mjs) = jedes ?v= (index.html, Importe der Module); die Proben prüfen die Gleichheit.
// Neuer CACHE_NAME → frischer Cache, addAll holt alles neu; fehlt eine Datei, bricht der Install ab (alter Stand bleibt).
// Jedes Modul steht hier mit genau dem ?v=, mit dem es importiert wird — sonst fehlt es offline (Test _test/node/version.test.mjs).

const CACHE_NAME = 'stunde-v3.1.0';
const CACHE_FAMILIE = CACHE_NAME.slice(0, CACHE_NAME.lastIndexOf('-v') + 2);

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './css/stunde.css?v=3.1.0',
  './js/stunde.mjs?v=3.1.0',
  './js/zustand.mjs?v=3.1.0',
  './js/dom.mjs?v=3.1.0',
  './js/eingabe.mjs?v=3.1.0',
  './js/einrichtung.mjs?v=3.1.0',
  './js/buehne.mjs?v=3.1.0',
  './js/austausch.mjs?v=3.1.0',
  './js/scanner.mjs?v=3.1.0',
  './js/kern/update.mjs?v=3.1.0',
  './js/phasenfenster.mjs?v=3.1.0',
  './js/bausteine.mjs?v=3.1.0',
  './js/stundenplan_ansicht.mjs?v=3.1.0',
  './js/sicherung_ansicht.mjs?v=3.1.0',
  './js/tage_ansicht.mjs?v=3.1.0',
  './logic/vorausfuellen.mjs?v=3.1.0',
  './logic/tage.mjs?v=3.1.0',
  './bilder/smiley_verstanden.png',
  './bilder/smiley_nicht_ganz.png',
  './logic/konstanten.mjs?v=3.1.0',
  './logic/plan.mjs?v=3.1.0',
  './logic/speicher.mjs?v=3.1.0',
  './logic/kurse.mjs?v=3.1.0',
  './logic/uhren.mjs?v=3.1.0',
  './logic/abgleich.mjs?v=3.1.0',
  './logic/planlink.mjs?v=3.1.0',
  './logic/auftragstext.mjs?v=3.1.0',
  './logic/bausteine_daten.mjs?v=3.1.0',
  './logic/stundentypen.mjs?v=3.1.0',
  './logic/textbausteine.mjs?v=3.1.0',
  './logic/stundenplan.mjs?v=3.1.0',
  './logic/stand_v3.mjs?v=3.1.0',
  './logic/klassenbuch.mjs?v=3.1.0',
  './logic/sicherung.mjs?v=3.1.0',
  './js/vendor/qrcode.js?v=3.1.0',
  './js/vendor/jsqr.js?v=3.1.0',
];

// Freigegebene Version (Zero 20.10.: „nur nach klicken das Update auch gezogen wird“): Der SW liefert aus dem Cache, den der
// Zeiger nennt, nicht automatisch aus dem neuesten — sonst käme eine neue Fassung beim nächsten Kaltstart ohne Klick.
// Der Zeiger liegt in einem eigenen Cache, der nicht mit CACHE_FAMILIE beginnt (der Cleanup räumt ihn nie).
const ZEIGER = CACHE_FAMILIE.slice(0, -2) + '-zeiger';   // stunde-zeiger
async function freigegeben() {
  const r = await (await caches.open(ZEIGER)).match('./freigegeben');
  const name = r ? await r.text() : null;
  return name && (await caches.has(name)) ? name : null;
}
async function setzeFrei(name) { await (await caches.open(ZEIGER)).put('./freigegeben', new Response(name)); }
async function raeumeAlte(behalte) {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith(CACHE_FAMILIE) && !behalte.includes(k)).map((k) => caches.delete(k)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache:'reload' — sonst kann index.html aus dem HTTP-Cache kommen (Pages ~10 min) und alt im Offline-Cache landen
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      // Erster Besuch oder Fassung vor 2.3.3 (kein Zeiger): diese Version ist sofort die freigegebene
      .then(async () => { if (!(await freigegeben())) await setzeFrei(CACHE_NAME); })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(freigegeben().then((frei) => raeumeAlte([CACHE_NAME, frei])).then(() => self.clients.claim()));
});

// Seite fragt: läuft die neueste Fassung? · Klick auf „Aktualisieren“: neueste freigeben, alte räumen.
self.addEventListener('message', (event) => {
  const typ = event.data && event.data.typ, port = event.ports && event.ports[0];
  if (!port) return;
  if (typ === 'status') event.waitUntil(freigegeben().then((frei) => port.postMessage({ frei, neu: CACHE_NAME })));
  else if (typ === 'freigeben') event.waitUntil(setzeFrei(CACHE_NAME).then(() => raeumeAlte([CACHE_NAME])).then(() => port.postMessage({ frei: CACHE_NAME })));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Alles aus dem Speicher, auch die Seite (Zero 20.10.: „Ich will dass die App sich öffnet und nicht zuerst auf Updates …
  // prüft“). Bis 2.3.2 holte die Navigation zuerst das Netz, ohne Zeitgrenze: in einem WLAN, das verbunden ist, aber nicht
  // antwortet, öffnete die App nicht (Zeros Vorfall; gemessen 20.10.: nach 20 s nicht offen, WLAN aus: sofort).
  // Dateien mit genau diesem ?v= aus dem freigegebenen Cache (bis 2.0.0 ignoreSearch über alle Caches: alte Skripte nach Update).
  event.respondWith((async () => {
    const cache = await caches.open((await freigegeben()) || CACHE_NAME);
    const navi = event.request.mode === 'navigate';
    const treffer = navi
      ? (await cache.match(event.request, { ignoreSearch: true })) || (await cache.match('./index.html'))
      : await cache.match(event.request);
    if (treffer) return treffer;
    try { return await fetch(event.request); }
    catch { return navi ? ((await cache.match('./index.html')) || Response.error()) : Response.error(); }
  })());
});
