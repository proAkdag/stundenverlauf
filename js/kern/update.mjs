// Stundenverlauf · js/kern/update.mjs — Update im Hintergrund, übernommen nur auf Klick (Zero 20.10.). Muster: Kladde.
/* Die App öffnet immer aus dem Speicher. Der Service Worker liefert die freigegebene Fassung; liegt eine neuere bereit,
   meldet er sie hier. Das Banner in der Einrichtung zeigt sie an, „Aktualisieren“ gibt sie frei und lädt neu — nie mitten
   in der Stunde, denn die Bühne zeigt kein Banner. Die Prüfung blockiert nie das Öffnen: sie läuft nach dem Laden, bei
   jedem Sichtbarwerden und auf „Nach Update suchen“. Suchen lädt eine neue Fassung nur herunter; benutzt wird sie erst
   nach dem Klick auf „Aktualisieren“. */
import { $, h } from '../dom.mjs?v=3.1.0';

let registrierung = null, neueFassung = false;
// vorUpdate: läuft nach dem Klick auf „Aktualisieren“, vor der Freigabe (js/sicherung_ansicht.mjs bietet dort das Sichern an)
export const updateHaken = { vorUpdate: async () => {} };

// Gefragt wird der neueste fertig geladene Worker. Ein wartender kennt die neue Fassung schon; wann der Browser ihn aktiv
// schaltet, ist egal (gemessen 20.10. in Chromium: bis ~30 s), weil auch der alte Worker nach der Freigabe aus dem neuen Cache liefert.
function frageSW(typ) {
  const sw = registrierung && (registrierung.waiting || registrierung.active);
  if (!sw) return Promise.resolve(null);
  return new Promise((ok) => {
    const kanal = new MessageChannel(), t = setTimeout(() => ok(null), 3000);
    kanal.port1.onmessage = (e) => { clearTimeout(t); ok(e.data); };
    sw.postMessage({ typ }, [kanal.port2]);
  });
}
async function pruefe() {
  const s = await frageSW('status');
  neueFassung = !!(s && s.frei && s.neu && s.frei !== s.neu);
  $('e-neu').hidden = !neueFassung;
  return neueFassung;
}
async function aktualisieren() {
  try { await updateHaken.vorUpdate(); } catch { /* Sichern abgebrochen: das Update geht trotzdem */ }
  const r = await frageSW('freigeben');
  if (r && r.frei) location.reload();
}

export function updateStarten() {
  $('e-neu-laden').addEventListener('click', aktualisieren);
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  addEventListener('load', () => {
    // updateViaCache:'none' — die Prüfung des Workers geht immer übers Netz, nie durch Safaris HTTP-Cache
    navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(r => {
      registrierung = r;
      const beobachte = (neu) => neu?.addEventListener('statechange', () => { if (neu.state === 'installed' || neu.state === 'activated') pruefe(); });
      beobachte(r.installing);   // die Prüfung beim Öffnen kann schon vor register() begonnen haben
      r.addEventListener('updatefound', () => beobachte(r.installing));
      navigator.serviceWorker.addEventListener('controllerchange', pruefe);
      pruefe();
      r.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') r.update().then(pruefe, () => {}); });
    }).catch(() => {});
  });
}

/* Ein neuer Worker lädt nach update() noch seine Dateien: warten, bis er fertig ist (höchstens 20 s) */
function fertigGeladen() {
  const nw = registrierung?.installing;
  if (!nw) return Promise.resolve();
  return new Promise(ok => {
    const t = setTimeout(ok, 20000);
    nw.addEventListener('statechange', () => { if (nw.state !== 'installing') { clearTimeout(t); ok(); } });
  });
}
/* Der Knopf sagt das Ergebnis selbst (Entwurf 2.4): 4 s lang, dann wieder „Nach Update suchen“ */
const RUHE = 'Nach Update suchen';
let ruheTimer = 0;
async function suchen(knopf) {
  const sage = (t, halten = true) => {
    knopf.textContent = t;
    clearTimeout(ruheTimer);
    if (halten) ruheTimer = setTimeout(() => { knopf.textContent = RUHE; }, 4000);
  };
  knopf.disabled = true;
  sage('Suche …', false);
  try {
    // die Registrierung beim Öffnen kann noch laufen — dann die vorhandene holen
    if (!registrierung && 'serviceWorker' in navigator) registrierung = (await navigator.serviceWorker.getRegistration().catch(() => null)) || null;
    if (!registrierung) { sage('Keine Updates hier'); return; }
    try { await registrierung.update(); } catch { sage('Kein Netz'); return; }
    await fertigGeladen();
    sage((await pruefe()) ? 'Update bereit' : 'Neueste Fassung');
  } finally { knopf.disabled = false; }
}

/* Fester Eintrag: Versionsnummer und „Nach Update suchen“. Ein Baustein, der in jeden Behälter passt —
   der Ort steht in index.html (#e-update, Entwurf: am Ende der Einrichtung). */
export function updateEintrag(ziel, version) {
  const knopf = h('button', { type: 'button', class: 'knopf', id: 'e-update-suchen', 'aria-live': 'polite' }, RUHE);
  knopf.addEventListener('click', () => suchen(knopf));
  ziel.replaceChildren(h('span', {}, 'Version ', h('b', {}, version)), knopf);
}
