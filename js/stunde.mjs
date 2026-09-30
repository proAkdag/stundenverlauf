// Stundenverlauf · App (aus stundenverlauf_v1.html aufgeteilt am 2026-09-30, seitdem hier die Quelle)
// Version: APP_VERSION = CACHE_NAME im Service Worker = ?v= in index.html — beim Ändern alle drei heben.
export const APP_VERSION = '2.3.1';

/* ─── Fachfarben: [Farbton, Helligkeitsstufe] je Fach, übernommen aus der Kladde
   (Klausurkorrektur/kladde/app/logic/fachfarben.mjs, FAECHER, Stand v1.10.1). ─── */
const FAECHER = {
  'Mathematik': [252, 0], 'Physik': [36, 0], 'Informatik': [144, 0], 'Chemie': [168, 1], 'Biologie': [108, 0],
  'NW': [312, 1], 'Technik': [336, 1], 'Deutsch': [84, 1], 'Englisch': [300, 0], 'Spanisch': [12, 1],
  'Französisch': [132, 0], 'Latein': [324, 0], 'Geschichte': [156, 0], 'Philosophie': [276, 0],
  'Praktische Philosophie': [96, 1], 'Pädagogik': [240, 1], 'Sozialwissenschaften': [348, 0],
  'Gesellschaftslehre': [60, 1], 'Politik': [252, 1], 'Erdkunde': [0, 0], 'Wirtschaft': [264, 1],
  'Kunst': [204, 1], 'Musik': [264, 0], 'Sport': [192, 1], 'Hauswirtschaft': [12, 0], 'Religion': [216, 1],
  'Katholische Religion': [120, 0], 'Evangelische Religion': [324, 1], 'Arbeitslehre': [180, 1],
  'Darstellen und Gestalten': [72, 1],
};
const FACH_LISTE = Object.keys(FAECHER).sort((a, b) => a.localeCompare(b, 'de'));
const ANZEIGE = { 'Mathematik': 'Mathe' };   // so, wie man es in der Klasse sagt

const MATERIAL = [
  ['ipad', 'iPad'], ['buch', 'Buch'], ['heft', 'Heft'], ['mappe', 'Mappe'], ['schreibzeug', 'Schreibzeug'],
  ['buntstifte', 'Buntstifte'], ['lineal', 'Lineal'], ['geodreieck', 'Geodreieck'], ['zirkel', 'Zirkel'],
  ['taschenrechner', 'Taschenrechner'], ['schere', 'Schere'], ['kleber', 'Kleber'],
  ['arbeitsblatt', 'Arbeitsblatt'], ['kopfhoerer', 'Kopfhörer'],
];
const MAT_NAME = Object.fromEntries(MATERIAL);

/* laut = Stufe des Lautstärke-Zeichens (Zero 2026-09-30: Einzel still · Partner flüstern · Gruppe leise · Plenum eine Person) */
const FORM = {
  einzel:  { name: 'Einzelarbeit',  kurz: 'Einzel',  laut: 0,    hinweis: () => 'Du arbeitest allein und still.' },
  partner: { name: 'Partnerarbeit', kurz: 'Partner', laut: 1,    hinweis: () => 'Ihr arbeitet zu zweit und flüstert.' },
  gruppe:  { name: 'Gruppenarbeit', kurz: 'Gruppe',  laut: 2,    hinweis: p => `Ihr arbeitet in ${p.groesse}er-Gruppen mit leiser Stimme.` },
  plenum:  { name: 'Plenum',        kurz: 'Plenum',  laut: 3,    hinweis: () => 'Wir arbeiten alle zusammen. Eine Person spricht, alle hören zu.' },
  pause:   { name: 'Pause',         kurz: 'Pause',   laut: null, hinweis: () => 'Kurz durchatmen – gleich geht es weiter.' },
};
const LAUT = ['still', 'flüstern', 'leise', 'eine Person spricht'];
const ARBEIT = ['einzel', 'partner', 'gruppe', 'plenum'];
const ABSCHLUSS_STANDARD = 'Wir sichern gemeinsam, was du heute gelernt hast.';

/* ─── Linien-Icons (24er Raster, Strich 1,7 wie in der Kladde) ─── */
const PFADE = {
  ipad: '<rect x="5" y="2.5" width="14" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
  buch: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5V20"/>',
  heft: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8.5 3v18"/><path d="M11.5 8h4.5M11.5 11.5h4.5"/>',
  mappe: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.3l2 2.2h8.7A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  schreibzeug: '<path d="M4.5 19.5l1-4L15.6 5.4a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8.5 18.5z"/><path d="M13.8 7.2l3 3"/>',
  buntstifte: '<path d="M4.5 20.5V9.5l2-5.5 2 5.5v11"/><path d="M10 20.5V9.5l2-5.5 2 5.5v11"/><path d="M15.5 20.5V9.5l2-5.5 2 5.5v11"/><path d="M4.5 9.5h4M10 9.5h4M15.5 9.5h4"/>',
  lineal: '<rect x="2.5" y="8" width="19" height="8" rx="1.2"/><path d="M6 8v3M9.5 8v2M13 8v3M16.5 8v2M20 8v3" transform="translate(-.5 0)"/>',
  geodreieck: '<path d="M2.5 19h19L12 5.5z"/><path d="M8.5 19a3.5 3.5 0 0 1 7 0"/><path d="M12 19v-1.8"/>',
  zirkel: '<circle cx="12" cy="4.5" r="1.6"/><path d="M11.2 6L6 20.5"/><path d="M12.8 6L18 20.5"/><path d="M8.2 14.5h7.6"/>',
  taschenrechner: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="3.6" rx=".6"/><circle cx="8.8" cy="13" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r=".9" fill="currentColor" stroke="none"/><circle cx="15.2" cy="13" r=".9" fill="currentColor" stroke="none"/><circle cx="8.8" cy="16.8" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="16.8" r=".9" fill="currentColor" stroke="none"/><circle cx="15.2" cy="16.8" r=".9" fill="currentColor" stroke="none"/>',
  schere: '<circle cx="6.5" cy="17.5" r="2.8"/><circle cx="17.5" cy="17.5" r="2.8"/><path d="M8.4 15.4L18 3.5"/><path d="M15.6 15.4L6 3.5"/>',
  kleber: '<rect x="7.5" y="9.5" width="9" height="11.5" rx="1.5"/><path d="M9 9.5V6.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.7"/><path d="M10.5 5.8V3.5h3v2.3"/><path d="M7.5 13.5h9"/>',
  arbeitsblatt: '<path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14.5 2.5V7H19"/><path d="M9 11h7M9 14.5h7M9 18h4"/>',
  kopfhoerer: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6.5" rx="1.5"/><rect x="17" y="14" width="4" height="6.5" rx="1.5"/>',
  eigenes: '<path d="M3.5 12V4.8a1.3 1.3 0 0 1 1.3-1.3H12l8.5 8.5-8.5 8.5z"/><circle cx="8" cy="8" r="1.3"/>',
  einzel: '<circle cx="12" cy="7" r="3.6"/><path d="M5 20.5c.6-4.2 3.4-6.6 7-6.6s6.4 2.4 7 6.6"/>',
  partner: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="8" r="3"/><path d="M2.5 20c.5-3.6 2.7-5.8 5.5-5.8s5 2.2 5.5 5.8"/><path d="M14.3 14.5c.7-.2 1.4-.3 2.2-.3 2.8 0 4.6 2.2 5 5.8"/>',
  gruppe: '<circle cx="12" cy="7" r="2.8"/><circle cx="5.3" cy="9.6" r="2.2"/><circle cx="18.7" cy="9.6" r="2.2"/><path d="M7 20.5c.4-3.5 2.4-5.6 5-5.6s4.6 2.1 5 5.6"/><path d="M1.8 18.6c.3-2.5 1.6-4 3.5-4 .9 0 1.7.3 2.3.9"/><path d="M22.2 18.6c-.3-2.5-1.6-4-3.5-4-.9 0-1.7.3-2.3.9"/>',
  plenum: '<rect x="3.5" y="2.5" width="17" height="8.5" rx="1.2"/><circle cx="6.5" cy="15.2" r="1.8"/><circle cx="12" cy="15.2" r="1.8"/><circle cx="17.5" cy="15.2" r="1.8"/><path d="M3.6 21c.3-1.7 1.4-2.7 2.9-2.7s2.6 1 2.9 2.7M9.1 21c.3-1.7 1.4-2.7 2.9-2.7s2.6 1 2.9 2.7M14.6 21c.3-1.7 1.4-2.7 2.9-2.7s2.6 1 2.9 2.7"/>',
  pause: '<path d="M4 9h13v4.5a5.5 5.5 0 0 1-5.5 5.5h-2A5.5 5.5 0 0 1 4 13.5z"/><path d="M17 10.5h1.2a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3"/><path d="M3.5 21.5h15"/>',
  abschluss: '<path d="M5.5 21V3.5"/><path d="M5.5 4.5h12l-2.4 4 2.4 4h-12"/>',
  start: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3.5 21h17"/><circle cx="14.6" cy="12.5" r=".95" fill="currentColor" stroke="none"/>',
  heute: '<path d="M9.5 6h11M9.5 12h11M9.5 18h11"/><circle cx="4.8" cy="6" r="1.4"/><circle cx="4.8" cy="12" r="1.4"/><circle cx="4.8" cy="18" r="1.4"/>',
  modul: '<path d="M12 3.5l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 16.5l9 5 9-5"/>',
  play: '<path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z" fill="currentColor"/>',
  halt: '<rect x="6.5" y="4.5" width="3.8" height="15" rx="1" fill="currentColor"/><rect x="13.7" y="4.5" width="3.8" height="15" rx="1" fill="currentColor"/>',
  neu: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.5v3.8h3.8"/>',
  links: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  rechts: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  hoch: '<path d="M6 14.5l6-6 6 6"/>',
  runter: '<path d="M6 9.5l6 6 6-6"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  zahnrad: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5"/><circle cx="12" cy="12" r="6.5"/>',
  vollbild: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  laut: '<path d="M3.5 9.5h3.8L12 5.3v13.4l-4.7-4.2H3.5z"/>',
  still: '<path d="M3.5 9.5h3.8L12 5.3v13.4l-4.7-4.2H3.5z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>',
  ziel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  danach: '<path d="M4 12h14"/><path d="M13 6.5l5.5 5.5-5.5 5.5"/>',
  fertig: '<path d="M4.5 12.5l4.5 4.5 10.5-11"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><rect x="8" y="8" width="3" height="3" rx=".5"/><rect x="13" y="8" width="3" height="3" rx=".5"/><rect x="8" y="13" width="3" height="3" rx=".5"/><path d="M13.5 13.5H16V16"/>',
};
const ICON_CACHE = {};
function icon(name) {
  if (!ICON_CACHE[name]) {
    const t = document.createElement('template');
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + (PFADE[name] || PFADE.eigenes) + '</svg>';
    ICON_CACHE[name] = t.content.firstElementChild;
  }
  return ICON_CACHE[name].cloneNode(true);
}

/* ─── DOM-Helfer: Text immer als Textknoten, nie als HTML ─── */
const $ = id => document.getElementById(id);
function h(tag, attrs = {}, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kinder.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

/* ─── Speicher: sechs Stunden des Tages, jede mit eigenem Plan (Zero 2026-09-30).
   localStorage dieses Geräts; ohne Speicher läuft die Seite trotzdem.
   Format (Schlüssel stundenverlauf.v2, seit 2.1.0 um Felder erweitert, alte Stände laden unverändert):
     stunden[6]  Plan | null — Plan: pid, fach, kurs, thema, modul, ziel, material[], eigenes[], einstieg,
                 phasen[{id, typ, min, groesse, auftrag, fertig, offen}], abschluss{min, text, ha}, gelaufen ('JJJJ-MM-TT' | '')
                 pid (2.3) = Kennung der Stunde über Geräte hinweg: ein Plan, der mit derselben pid zurückkommt, aktualisiert
                 genau diese Stunde, auch während sie läuft (Uhren hängen an den Phasen-IDs, die mitreisen)
     muster[]    {name, einstieg, phasen[{typ, min, groesse}], abschlussMin, material[], eigenes[]} — nur Ablauf und Material (Zero)
     kurse{}     Schlüssel = Kursname klein → {name, datum, stunde, plan, uebertrag[Phase], offenErledigt} — zuletzt gestartete
                 Stunde je Kurs; ein Objekt ohne Prototyp, damit Kursnamen wie „constructor“ nichts Geerbtes treffen
     selbstlauf  Phasen wechseln nach Ablauf der Zeit von selbst (Schalter, aus)
     kamera      'environment' | 'user' — zuletzt gewählte Kamera des Scanners (2.3)
   Jedes Feld läuft beim Laden durch seine Prüfung — ein Feld, das dort fehlt, geht beim Neuladen verloren. ─── */
const SCHLUESSEL = 'stundenverlauf.v2';
const STUNDEN = 6;
const LAUF_GUELTIG_MS = 4 * 3600e3;
const MUSTER_MAX = 20, KURSE_MAX = 40;
let speicherGeht = true;
let pidNeu = false;
const neueId =() => Math.random().toString(36).slice(2, 10);
const zahl = (v, min, max, std) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : std; };
const text = (v, max = 200) => typeof v === 'string' ? v.slice(0, max) : '';
const heute = () => { const d = new Date(Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const kursSchluessel = k => (k || '').trim().toLowerCase();
// nur eigene Schlüssel: „constructor“ oder „toString“ aus einem fremden Link sind kein Fach und keine Sozialform (Fremdprüfung 2.2)
const hat = (o, k) => typeof k === 'string' && Object.hasOwn(o, k);
// IDs reisen seit 2.3 mit (Link, QR): nur Kleinbuchstaben und Ziffern, und nie der Name eines festen Fensters
const FENSTER_FEST = new Set(['start', 'heute', 'abschluss']);
const gueltigeId = s => typeof s === 'string' && /^[a-z0-9]{1,20}$/.test(s) && !FENSTER_FEST.has(s);

function neuePhase(typ, min, groesse = 4) { return { id: neueId(), typ, min, groesse, auftrag: '', fertig: '', offen: false }; }
function standardPlan(fach = 'Mathematik') {
  return {
    pid: neueId(),
    fach, kurs: '', thema: '', modul: '', ziel: '',
    material: ['ipad', 'buch', 'mappe', 'schreibzeug'], eigenes: [],
    einstieg: 5,
    phasen: [neuePhase('einzel', 20), neuePhase('pause', 5), neuePhase('partner', 20)],
    abschluss: { min: 10, text: '', ha: '' },
    gelaufen: '',
  };
}
const pruefeMaterial = (m, std) => Array.isArray(m) ? MATERIAL.map(x => x[0]).filter(x => m.includes(x)) : std;
const pruefeEigenes = e => Array.isArray(e) ? e.filter(x => typeof x === 'string' && x.trim()).map(x => x.slice(0, 40)).slice(0, 8) : [];
function pruefePlan(p) {
  const d = standardPlan();
  if (!p || typeof p !== 'object') return d;
  const vergeben = new Set();   // zwei Phasen mit derselben ID teilten sich eine Uhr
  const eigeneId = id => { const neu = gueltigeId(id) && !vergeben.has(id) ? id : neueId(); vergeben.add(neu); return neu; };
  return {
    pid: gueltigeId(p.pid) ? p.pid : d.pid,
    fach: hat(FAECHER, p.fach) ? p.fach : d.fach,
    kurs: text(p.kurs, 20),
    thema: text(p.thema, 120), modul: text(p.modul, 120), ziel: text(p.ziel, 160),
    material: pruefeMaterial(p.material, d.material),
    eigenes: pruefeEigenes(p.eigenes),
    einstieg: Math.round(zahl(p.einstieg, 0, 60, d.einstieg)),
    phasen: Array.isArray(p.phasen)
      ? p.phasen.filter(x => x && hat(FORM, x.typ)).slice(0, 12).map(x => ({
          id: eigeneId(x.id), typ: x.typ,
          min: Math.round(zahl(x.min, 1, 120, 10)), groesse: Math.round(zahl(x.groesse, 3, 8, 4)), auftrag: text(x.auftrag, 600),
          fertig: text(x.fertig, 200), offen: x.offen === true,
        }))
      : d.phasen,
    abschluss: { min: Math.round(zahl(p.abschluss?.min, 0, 60, 10)), text: text(p.abschluss?.text, 160), ha: text(p.abschluss?.ha, 400) },
    gelaufen: /^\d{4}-\d\d-\d\d$/.test(p.gelaufen) ? p.gelaufen : '',
  };
}
function pruefeMuster(m) {
  if (!m || typeof m !== 'object' || typeof m.name !== 'string' || !m.name.trim() || !Array.isArray(m.phasen)) return null;
  const phasen = m.phasen.filter(x => x && hat(FORM, x.typ)).slice(0, 12)
    .map(x => ({ typ: x.typ, min: Math.round(zahl(x.min, 1, 120, 10)), groesse: Math.round(zahl(x.groesse, 3, 8, 4)) }));
  if (!phasen.length) return null;
  return { name: m.name.trim().slice(0, 40), einstieg: Math.round(zahl(m.einstieg, 0, 60, 5)), phasen,
    abschlussMin: Math.round(zahl(m.abschlussMin, 0, 60, 10)), material: pruefeMaterial(m.material, []), eigenes: pruefeEigenes(m.eigenes) };
}
function pruefeKurs(k) {
  if (!k || typeof k !== 'object' || typeof k.name !== 'string' || !k.name.trim() || !/^\d{4}-\d\d-\d\d$/.test(k.datum) || !k.plan) return null;
  return { name: k.name.trim().slice(0, 20), datum: k.datum, stunde: Math.round(zahl(k.stunde, 0, STUNDEN - 1, 0)),
    plan: pruefePlan(k.plan), uebertrag: Array.isArray(k.uebertrag) ? pruefePlan({ phasen: k.uebertrag }).phasen : [],
    offenErledigt: k.offenErledigt === true };
}
function ladeSpeicher() {
  let roh = null;
  try { roh = JSON.parse(localStorage.getItem(SCHLUESSEL) || 'null'); } catch { speicherGeht = false; }
  const s = {
    lehrkraft: 'Akdağ', theme: 'hell', signal: true, selbstlauf: false, stunde: 67.5, aktiv: 0, stunden: Array(STUNDEN).fill(null), lauf: null,
    muster: [], kurse: Object.create(null), kamera: 'environment',
  };
  if (!roh || typeof roh !== 'object') return s;
  if (roh.kamera === 'user') s.kamera = 'user';
  if (typeof roh.lehrkraft === 'string') s.lehrkraft = roh.lehrkraft.slice(0, 40);
  if (roh.theme === 'dunkel') s.theme = 'dunkel';
  s.signal = roh.signal !== false;
  s.selbstlauf = roh.selbstlauf === true;
  if ([45, 60, 67.5, 90].includes(roh.stunde)) s.stunde = roh.stunde;
  s.aktiv = Math.round(zahl(roh.aktiv, 0, STUNDEN - 1, 0));
  if (Array.isArray(roh.stunden)) roh.stunden.slice(0, STUNDEN).forEach((p, i) => {
    if (!p) return;
    s.stunden[i] = pruefePlan(p);
    // Stand vor 2.3 ohne pid: die neue Kennung muss sofort gespeichert werden, sonst gilt nach dem Neuladen eine andere
    if (!gueltigeId(p.pid)) pidNeu = true;
  });
  if (Array.isArray(roh.muster)) s.muster = roh.muster.map(pruefeMuster).filter(Boolean).slice(0, MUSTER_MAX);
  if (roh.kurse && typeof roh.kurse === 'object')
    for (const [schl, k] of Object.entries(roh.kurse)) { const g = pruefeKurs(k); if (g && schl === kursSchluessel(g.name)) s.kurse[schl] = g; }
  const l = roh.lauf;
  if (l && Number.isInteger(l.stunde) && s.stunden[l.stunde] && Number.isFinite(l.stand) && Date.now() - l.stand < LAUF_GUELTIG_MS && l.uhren && typeof l.uhren === 'object') {
    const uhren = Object.create(null);   // Schlüssel sind Phasen-IDs — ohne Prototyp trifft keine ID etwas Geerbtes
    for (const [id, u] of Object.entries(l.uhren)) {
      if (!u || !Number.isFinite(u.gesamt) || !Number.isFinite(u.rest)) continue;
      const ende = Number.isFinite(u.ende) ? u.ende : null;
      // schon abgelaufen → kein Signal beim Öffnen; läuft noch → Signal am Ende wie sonst
      // weiter = der Selbstlauf hat von dieser Uhr aus schon weitergeschaltet
      uhren[id] = { gesamt: u.gesamt, rest: u.rest, ende, plan: u.plan, gestartet: !!u.gestartet, gemeldet: ende != null ? Date.now() >= ende : !!u.gemeldet, weiter: !!u.weiter };
    }
    s.lauf = { stunde: l.stunde, index: Math.round(zahl(l.index, 0, 40, 0)), uhren, stand: l.stand };
  }
  return s;
}
const S = ladeSpeicher();

/* Eine freie Stunde zeigt einen Entwurf; belegt (und gespeichert) wird sie erst beim ersten Eintrag */
let entwurf = null;
function fachDavor() {
  for (let i = S.aktiv - 1; i >= 0; i--) if (S.stunden[i]) return S.stunden[i].fach;
  return S.stunden.find(Boolean)?.fach || 'Mathematik';
}
function plan() { return S.stunden[S.aktiv] || (entwurf ||= standardPlan(fachDavor())); }
const fachAnzeige = (f = plan().fach) => ANZEIGE[f] || f;

let speicherTimer = 0;
function schreibe(sofort = false) {   // nur schreiben — für Einstellungen, die für alle Stunden gelten
  clearTimeout(speicherTimer);
  const jetzt = () => {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(S)); speicherGeht = true; }
    catch { speicherGeht = false; }
    $('e-fuss').textContent = speicherGeht
      ? 'Läuft ohne Internet. Die sechs Stunden bleiben auf diesem Gerät gespeichert.'
      : 'Läuft ohne Internet. Diese Ansicht speichert nichts (privates Fenster oder eingebettete Anzeige?) – Einträge gelten nur bis zum Schließen.';
  };
  if (sofort) jetzt(); else speicherTimer = setTimeout(jetzt, 250);
}
function speichere(sofort = false) {  // Plan der gewählten Stunde geändert → sie ist ab jetzt belegt
  if (!S.stunden[S.aktiv] && entwurf) { S.stunden[S.aktiv] = entwurf; entwurf = null; }
  kursMerken();
  malTag();
  schreibe(sofort);
}
/* Kurs-Gedächtnis: die zuletzt GESTARTETE Stunde eines Kurses wird seine „letzte Stunde“ — Grundlage für
   „Wie letzte Stunde“ und „Offen vom letzten Mal“ an einem späteren Tag. Nur Plandaten, keine Namen.
   Danach folgt der Eintrag den Änderungen genau dieser Stunde (auch einem geänderten Kursnamen); spätere
   Änderungen an einer früheren Stunde desselben Tages verdrängen ihn nicht (Fremdprüfung 2026-09-30). */
const offeneVon = k => [...k.uebertrag, ...k.plan.phasen.filter(p => p.offen)];
function kursMerken(i = S.aktiv, start = false) {
  const p = S.stunden[i];
  if (!p || p.gelaufen !== heute()) return;
  const schl = kursSchluessel(p.kurs);
  const eigene = Object.keys(S.kurse).filter(k => S.kurse[k].datum === p.gelaufen && S.kurse[k].stunde === i);
  if (!start && !eigene.length) return;
  if (!schl) return;   // leeres Feld (mitten im Umbenennen): Eintrag bleibt unter seinem Namen stehen
  const alt = S.kurse[schl] || null;
  // Übertrag: was offen blieb und weder eingefügt noch verworfen wurde, geht beim nächsten Start nicht still verloren
  const uebertrag = eigene.includes(schl) ? alt.uebertrag : alt && !alt.offenErledigt ? structuredClone(offeneVon(alt)).slice(0, 12) : [];
  const offenErledigt = eigene.includes(schl) && alt.offenErledigt;
  for (const k of eigene) delete S.kurse[k];
  S.kurse[schl] = { name: p.kurs.trim(), datum: p.gelaufen, stunde: i, plan: structuredClone(p), uebertrag, offenErledigt };
  const alle = Object.entries(S.kurse);
  if (alle.length > KURSE_MAX)
    alle.sort((a, b) => a[1].datum.localeCompare(b[1].datum)).slice(0, alle.length - KURSE_MAX).forEach(([k]) => delete S.kurse[k]);
}
addEventListener('pagehide', () => schreibe(true));

/* ─── Farbe und Anzeige ─── */
function setzeFarbe() {
  const [hue, stufe] = FAECHER[plan().fach] || [250, 0];
  document.documentElement.style.setProperty('--hue', String(hue));
  document.documentElement.style.setProperty('--stufe', String(stufe));
  document.documentElement.dataset.theme = S.theme;
}

const DATUM = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const ZEIT = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const halb = v => Number.isInteger(v) ? String(v) : Math.floor(v) + '½';

/* ═══ Einrichten ═══ */
function segment(name, optionen, wert, beiWahl, label) {
  return h('div', { class: 'segment', role: 'radiogroup', 'aria-label': label },
    optionen.map(([v, t]) => h('label', {},
      h('input', { type: 'radio', name, value: v, checked: v === wert, onchange: () => beiWahl(v) }),
      h('span', {}, t))));
}
function stepper(wert, { min, max, schritt, einheit, label }, beiAenderung) {
  let letzter = wert;
  const eingabe = h('input', { type: 'text', inputmode: 'numeric', value: String(wert), 'aria-label': label, autocomplete: 'off' });
  const setze = v => { v = Math.min(max, Math.max(min, v)); letzter = v; eingabe.value = String(v); beiAenderung(v); };
  const jetzt = () => { const n = parseInt(eingabe.value, 10); return Number.isFinite(n) ? n : letzter; };
  eingabe.addEventListener('change', () => setze(jetzt()));
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', 'aria-label': label + ' verringern', onclick: () => { const n = jetzt(); setze(schritt > 1 ? Math.ceil(n / schritt) * schritt - schritt : n - 1); } }, '−'),
    eingabe,
    einheit ? h('span', { class: 'einheit' }, einheit) : null,
    h('button', { type: 'button', 'aria-label': label + ' erhöhen', onclick: () => { const n = jetzt(); setze(schritt > 1 ? Math.floor(n / schritt) * schritt + schritt : n + 1); } }, '+'));
}

/* Aufträge mit Listen: jede Zeile, die mit „• “, „- “ oder „1. “ beginnt, ist ein Listenpunkt.
   Gespeichert wird reiner Text — das Format steckt nur in den Zeilenanfängen. */
const LISTE_RE = /^(\s*)(?:([•\-–*])|(\d+)([.)]))\s+/;
const FELD_WAECHST = !!window.CSS?.supports?.('field-sizing', 'content');
function zeilenBereich(v, a, e) {
  const start = v.lastIndexOf('\n', a - 1) + 1;
  let ende = v.indexOf('\n', e > a && v[e - 1] === '\n' ? e - 1 : e);
  return [start, ende < 0 ? v.length : ende];
}
function listeUmschalten(ta, art) {
  const v = ta.value, [start, ende] = zeilenBereich(v, ta.selectionStart, ta.selectionEnd);
  const zeilen = v.slice(start, ende).split('\n');
  const passt = z => { const m = z.match(LISTE_RE); return m && (art === 'punkt' ? !!m[2] : !!m[3]); };
  const aus = zeilen.some(passt) && zeilen.every(z => passt(z) || !z.trim());   // schon diese Liste → Zeichen weg
  // Nummern setzen fort, wenn die Zeile davor schon nummeriert ist
  const davor = v.slice(0, Math.max(0, start - 1)).split('\n').pop().match(LISTE_RE);
  let n = art === 'nummer' && davor && davor[3] ? Number(davor[3]) : 0;
  const neu = zeilen.map(z => {
    const roh = z.replace(LISTE_RE, '$1');
    if (aus || (!roh.trim() && zeilen.length > 1)) return roh;
    return roh.replace(/^\s*/, m => m + (art === 'punkt' ? '• ' : `${++n}. `));
  }).join('\n');
  ta.value = v.slice(0, start) + neu + v.slice(ende);
  ta.focus();
  ta.setSelectionRange(start + neu.length, start + neu.length);
  ta.dispatchEvent(new Event('input'));
}
function listeWeiter(e) {   // Enter in einem Listenpunkt: nächster Punkt; Enter auf leerem Punkt beendet die Liste
  const ta = e.target;
  // keyCode 229: Safari meldet so das Enter, das eine Wortvorschlag-/IME-Eingabe abschließt
  if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229 || e.shiftKey || ta.selectionStart !== ta.selectionEnd) return;
  const v = ta.value, a = ta.selectionStart, start = v.lastIndexOf('\n', a - 1) + 1;
  const m = v.slice(start, a).match(LISTE_RE);
  if (!m) return;
  e.preventDefault();
  if (!v.slice(start + m[0].length, a).trim()) {
    ta.value = v.slice(0, start) + v.slice(a);
    ta.setSelectionRange(start, start);
  } else {
    const praefix = m[1] + (m[2] ? m[2] : (Number(m[3]) + 1) + m[4]) + ' ';
    ta.value = v.slice(0, a) + '\n' + praefix + v.slice(a);
    ta.setSelectionRange(a + 1 + praefix.length, a + 1 + praefix.length);
  }
  ta.dispatchEvent(new Event('input'));
}
function auftragFeld(wert, { placeholder, label, max, klasse = '' }, beiEingabe) {
  const ta = h('textarea', { rows: '2', maxlength: String(max), placeholder, 'aria-label': label, autocomplete: 'off' });
  ta.value = wert;
  // wächst mit dem Text; wo field-sizing fehlt (ältere Safari), per Skript — auf dem iPad gibt es keinen Zieh-Griff
  const wachse = () => { if (!FELD_WAECHST) { ta.style.height = 'auto'; ta.style.height = Math.min(280, ta.scrollHeight + 2) + 'px'; } };
  ta.addEventListener('input', () => { wachse(); beiEingabe(ta.value); });
  requestAnimationFrame(wachse);
  ta.addEventListener('keydown', listeWeiter);
  // Knopf nimmt den Fokus nicht weg — sonst ginge die Markierung im Textfeld verloren
  const knopf = (art, text, aria) => h('button', { type: 'button', class: 'knopf', 'aria-label': aria,
    onpointerdown: e => e.preventDefault(), onclick: () => listeUmschalten(ta, art) }, text);
  return h('div', { class: 'auftrag-feld ' + klasse }, ta,
    h('div', { class: 'auftrag-werkzeug' }, knopf('punkt', '• Punkte', 'Aufzählung mit Punkten'), knopf('nummer', '1. Nummern', 'Nummerierte Liste')));
}
/* Stichpunkt für die Anfangsübersicht: erste Zeile mit Inhalt (reine Listenzeichen zählen nicht), ohne Listenzeichen;
   endet sie auf „:“ („Aufgaben:“), kommt die nächste Zeile dazu. Höchstens max Zeichen, an einer Wortgrenze gekürzt. */
function stichpunkt(roh, max = 34) {
  const zeilen = (roh || '').split('\n').map(z => z.replace(LISTE_RE, '').trim()).filter(z => /[\p{L}\p{N}]/u.test(z) && !/^\d+[.)]$/.test(z));
  const t = (zeilen[0]?.endsWith(':') && zeilen[1] ? zeilen[0] + ' ' + zeilen[1] : zeilen[0] || '').replace(/\s*:$/, '');
  if (t.length <= max) return t;
  const schnitt = t.slice(0, max + 1).lastIndexOf(' ');
  return t.slice(0, schnitt > max * .6 ? schnitt : max).replace(/[\s,;.:–-]+$/, '') + ' …';
}
/* Bühne: Text → Absätze und Listen (Nummern so, wie sie getippt wurden) */
function auftragKasten(titel, roh) {
  const bloecke = [];
  let liste = null, zeilen = 0;
  for (const z of roh.split('\n')) {
    if (!z.trim()) { liste = null; continue; }
    zeilen++;
    const m = z.match(LISTE_RE), art = m ? (m[2] ? 'ul' : 'ol') : null;
    if (!art) { liste = null; bloecke.push(h('p', {}, z.trim())); continue; }
    if (!liste || liste.tagName.toLowerCase() !== art) bloecke.push(liste = h(art, { class: 'a-liste' }));
    liste.append(h('li', { value: m[3] || null }, z.slice(m[0].length).trim()));
  }
  return h('div', { class: 'auftrag' + (zeilen > 6 ? ' sehr-lang' : zeilen > 3 ? ' lang' : '') }, h('b', {}, titel), bloecke);
}

function malAnzeige() {
  $('e-anzeige').replaceChildren(
    segment('theme', [['hell', 'Hell'], ['dunkel', 'Dunkel']], S.theme, v => { S.theme = v; setzeFarbe(); schreibe(); }, 'Anzeige'),
    h('label', { class: 'schalter' },
      h('input', { type: 'checkbox', checked: S.signal, onchange: e => { S.signal = e.target.checked; schreibe(); } }),
      'Signal am Ende'),
    // Selbstlauf (Zero 2026-09-30): ab dem Start der 1. Phase wechseln die Phasen nach Ablauf der Zeit von selbst
    h('label', { class: 'schalter' },
      h('input', { type: 'checkbox', id: 'e-selbstlauf', checked: S.selbstlauf, onchange: e => { S.selbstlauf = e.target.checked; if (S.selbstlauf) selbstlaufAb(); schreibe(); } }),
      'Selbstlauf'));
}

/* ─── Kurs: „Wie letzte Stunde“ und „Offen vom letzten Mal“ — nur an einem anderen Tag als die letzte Stunde ─── */
const TAG_KURZ = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const datumKurz = iso => { const [j, m, t] = iso.split('-').map(Number); return TAG_KURZ.format(new Date(j, m - 1, t)); };
function letzteStunde() {
  const P = plan(), k = S.kurse[kursSchluessel(P.kurs)];
  // kein Angebot am selben Tag — und keins auf sich selbst: steht im Platz noch genau jene Stunde, ist alles schon da
  return k && k.datum !== heute() && !(k.stunde === S.aktiv && P.gelaufen === k.datum) ? k : null;
}
function malKursAngebot() {
  const k = letzteStunde();
  if (!k) { $('e-kurs-angebot').replaceChildren(); return; }
  const offen = k.offenErledigt ? [] : offeneVon(k);
  $('e-kurs-angebot').replaceChildren(
    h('button', { type: 'button', class: 'knopf kurs-weiter', onclick: wieLetzteStunde }, `Wie letzte Stunde · ${k.name} · ${datumKurz(k.datum)}`),
    offen.length ? h('div', { class: 'offen-karte' },
      h('p', {}, h('b', {}, 'Offen vom letzten Mal')),
      h('ul', {}, offen.map(p => h('li', {}, icon(p.typ), h('span', {}, formName(p) + (stichpunkt(p.auftrag) ? ' – ' + stichpunkt(p.auftrag) : ''))))),
      h('div', { class: 'offen-knoepfe' },
        h('button', { type: 'button', class: 'knopf', onclick: offenEinfuegen }, 'Vorne einfügen'),
        h('button', { type: 'button', class: 'knopf', onclick: offenVerwerfen }, 'Verwerfen'))) : null);
}
function wieLetzteStunde() {
  const k = letzteStunde(), P = plan();
  if (!k) return;
  const hatInhalt = S.stunden[S.aktiv] && [P.thema, P.modul, P.ziel, P.abschluss.text, P.abschluss.ha, ...P.phasen.flatMap(p => [p.auftrag, p.fertig])].some(t => t.trim());
  if (hatInhalt && !confirm(`${S.aktiv + 1}. Stunde mit der letzten Stunde der ${k.name} überschreiben?`)) return;
  // alles außer der Hausaufgabe (die eigene bleibt); die offenen Phasen jener Stunde stecken schon im Ablauf,
  // Übertragenes von noch früher kommt nach vorn
  // die Stunde behält ihre Kennung (pid) — die alte Stunde des Kurses trägt ihre eigene
  const neu = pruefePlan({ ...structuredClone(k.plan), pid: P.pid, kurs: P.kurs.trim() || k.name, gelaufen: '' });
  neu.abschluss.ha = P.abschluss.ha;
  neu.phasen = [...structuredClone(k.uebertrag), ...neu.phasen].slice(0, 12);
  neu.phasen.forEach(p => { p.id = neueId(); p.offen = false; });
  S.stunden[S.aktiv] = neu; entwurf = null;
  if (S.lauf?.stunde === S.aktiv) S.lauf = null;
  k.offenErledigt = true;
  speichere(); malEinrichten();
}
function offenEinfuegen() {
  const k = letzteStunde(), P = plan();
  if (!k) return;
  const neu = offeneVon(k).map(p => ({ ...structuredClone(p), id: neueId(), offen: false }));
  if (neu.length + P.phasen.length > 12 && !confirm('Es passen höchstens 12 Phasen – die letzten fallen dabei weg. Trotzdem vorne einfügen?')) return;
  P.phasen = [...neu, ...P.phasen].slice(0, 12);
  k.offenErledigt = true;
  speichere(); malEinrichten();
}
function offenVerwerfen() {
  const k = letzteStunde();
  if (!k) return;
  k.offenErledigt = true;
  schreibe(); malKursAngebot();
}

/* ─── Muster: nur Ablauf und Material (Zero 2026-09-30) — Tipp lädt, × löscht ─── */
function malMuster() {
  $('e-muster').replaceChildren(
    ...S.muster.map((m, i) => h('span', { class: 'chip muster-chip' },
      h('button', { type: 'button', class: 'muster-laden', onclick: () => musterLaden(i) }, m.name),
      h('button', { type: 'button', 'aria-label': `Muster ${m.name} löschen`, onclick: () => musterLoeschen(i) }, icon('x')))),
    // ohne Phasen gibt es nichts zu merken
    h('button', { type: 'button', class: 'knopf muster-neu', disabled: !plan().phasen.length, onclick: musterSpeichern }, '+ Als Muster speichern'));
}
function musterSpeichern() {
  const P = plan();
  const name = prompt('Name für das Muster (z. B. Übungsstunde):', `${P.phasen.filter(p => p.typ !== 'pause').length} Phasen · ${halb(S.stunde)} min`);
  const m = pruefeMuster({ name, einstieg: P.einstieg, phasen: P.phasen, abschlussMin: P.abschluss.min, material: P.material, eigenes: P.eigenes });
  if (!m) return;
  const alt = S.muster.findIndex(x => x.name.toLowerCase() === m.name.toLowerCase());
  if (alt >= 0) { if (!confirm(`Muster „${m.name}“ ersetzen?`)) return; S.muster[alt] = m; }
  else if (S.muster.length >= MUSTER_MAX) { alert(`Es gibt schon ${MUSTER_MAX} Muster. Lösche zuerst eines (×) oder ersetze eines mit gleichem Namen.`); return; }
  else S.muster.push(m);
  schreibe(); malMuster();
}
function musterLaden(i) {
  const m = S.muster[i], P = plan();
  if (!m) return;
  if (P.phasen.some(p => p.auftrag.trim() || p.fertig.trim())
    && !confirm(`Ablauf der ${S.aktiv + 1}. Stunde durch „${m.name}“ ersetzen? Die Aufträge der Phasen gehen dabei verloren.`)) return;
  P.einstieg = m.einstieg;
  P.phasen = m.phasen.map(x => neuePhase(x.typ, x.min, x.groesse));
  P.abschluss.min = m.abschlussMin;
  P.material = [...m.material]; P.eigenes = [...m.eigenes];
  speichere(); malEinrichten();
}
/* ─── Weitergeben (2.2, Zero „Beides“): der Plan einer Stunde als Link — gepackt im Teil hinter „#“, den der Browser
   nie an einen Server schickt — und als QR-Code (qrcode-generator, MIT, aus der Werft-Arena). Das Handy scannt ihn mit
   der Kamera, öffnet die App und übernimmt den Plan in eine Stunde seiner Wahl. Nur Plandaten, keine Namen. ─── */
const b64url = {
  an: u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  ab: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
};
const strom = async (bytes, umform) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(umform)).arrayBuffer());
/* 2.3 (Zero: „Smartphone ist damit die Zentrale“): pid und Phasen-IDs reisen mit. Kommt der Plan mit derselben pid
   zurück, aktualisiert er genau diese Stunde — auch während sie auf der Bühne läuft. „offen“ und „gelaufen“ bleiben
   Sache des Geräts, auf dem die Stunde lief. */
async function planLink(p) {
  const { gelaufen, ...rest } = structuredClone(p);
  rest.phasen = rest.phasen.map(({ offen, ...x }) => x);
  const gepackt = await strom(new TextEncoder().encode(JSON.stringify(rest)), new CompressionStream('deflate-raw'));
  return location.origin + location.pathname + '#plan=' + b64url.an(gepackt);
}
async function planAusLink(hash) {
  const m = /^#plan=([A-Za-z0-9_-]{1,12000})$/.exec(hash);   // Grenze: ein QR-Code trägt ohnehin weniger
  if (!m) return null;
  const roh = await strom(b64url.ab(m[1]), new DecompressionStream('deflate-raw'));
  if (roh.length > 65536) return null;
  const o = JSON.parse(new TextDecoder().decode(roh));
  if (!o || typeof o !== 'object' || Array.isArray(o) || !Array.isArray(o.phasen)) return null;
  // fremde Daten: nur was die Prüfung durchlässt (IDs nur a–z0–9, eindeutig, nie ein festes Fenster);
  // „offen“ und „gelaufen“ gehören dem Gerät, auf dem die Stunde lief
  const p = pruefePlan(o);
  p.phasen.forEach(x => { x.offen = false; });
  p.gelaufen = '';
  return p;
}
async function weitergeben() {
  // ein Entwurf bekäme nach dem Neuladen eine neue pid — wer ihn weitergibt, belegt die Stunde
  if (!S.stunden[S.aktiv]) speichere(true);
  const P = plan(), box = $('d-weiter-qr');
  let link = '', svg = '', grund = '';
  try { link = await planLink(P); } catch { grund = 'dieser Browser kann den Plan nicht verpacken.'; }
  if (link) {
    if (typeof qrcode !== 'function') grund = 'der QR-Baustein ist nicht geladen, bitte „Link teilen“.';
    else try { const qr = qrcode(0, 'L'); qr.addData(link, 'Byte'); qr.make(); svg = qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true }); }
    catch { grund = 'zu lang für einen QR-Code, bitte „Link teilen“.'; }
  }
  $('d-weiter-text').textContent = `${S.aktiv + 1}. Stunde · ${fachAnzeige(P.fach)}${P.kurs.trim() ? ' · ' + P.kurs.trim() : ''}${P.thema.trim() ? ' · ' + P.thema.trim() : ''} — `
    + (svg ? 'am anderen Gerät in der App mit „Plan holen“ scannen, während der Stunde auf der Bühne mit „Update holen“.' : grund);
  if (svg) box.innerHTML = svg; else box.replaceChildren();
  box.hidden = !svg;
  box.dataset.link = link;
  $('d-weiter-teilen').textContent = 'Link teilen';
  $('d-weiter-teilen').disabled = !link;
  $('d-weiter').showModal();
}
async function linkTeilen() {
  const link = $('d-weiter-qr').dataset.link;
  if (!link) return;
  if (navigator.share) { try { await navigator.share({ title: 'Stundenverlauf', url: link }); } catch { /* abgebrochen */ } return; }
  try { await navigator.clipboard.writeText(link); $('d-weiter-teilen').textContent = 'Link kopiert'; }
  catch { $('d-weiter-teilen').textContent = 'Kopieren nicht möglich'; }
}
let eingang = null;
async function importPruefen() {   // mit #plan=… geöffnet (Kamera-App, geteilter Link)
  if (!location.hash.startsWith('#plan=')) return;
  const hash = location.hash;
  history.replaceState(null, '', location.pathname + location.search);   // einmal übernehmen, nicht bei jedem Neuladen
  await eingangLesen(hash);
}
/* Gemeinsamer Weg für Link und Scanner. Auf der Bühne: gleiche pid wie die laufende Stunde → sofort übernehmen,
   die Bühne bleibt offen. Ein Code einer anderen Stunde aus „Update holen“ schließt die Bühne nicht (Fremdprüfung 2.3,
   Befund 2) — nur ein geöffneter Link führt, wie in 2.2, erst zur Einrichtung (nie über der laufenden Bühne). */
async function eingangLesen(hash, vonBuehne = false) {
  let p = null;
  try { p = await planAusLink(hash); } catch { p = null; }
  if (!p) { meldung('Dieser Code enthält keinen lesbaren Plan.'); return; }
  if (buehneAn && S.stunden[S.aktiv]?.pid === p.pid) { planAktualisieren(S.aktiv, p); meldung('Plan aktualisiert'); return; }
  if (buehneAn && vonBuehne) { meldung('Dieser Code gehört zu einer anderen Stunde – in der Einrichtung mit „Plan holen“ übernehmen.'); return; }
  if (buehneAn) zurEinrichtung();
  eingang = p;
  // Vorschlag: dieselbe Stunde, sonst eine freie, sonst eine, die gerade NICHT läuft — nie still die laufende ersetzen
  const laeuft = laufFrisch() ? S.lauf.stunde : -1;
  const gleich = S.stunden.findIndex(x => x && x.pid === p.pid), frei = S.stunden.findIndex(x => !x);
  const sonst = S.aktiv !== laeuft ? S.aktiv : S.stunden.findIndex((x, i) => i !== laeuft);
  $('d-import-stunde').replaceChildren(...S.stunden.map((x, i) => h('option', { value: String(i) },
    `${i + 1}. Stunde · ${x ? fachAnzeige(x.fach) + (x.thema.trim() ? ' · ' + x.thema.trim() : '')
      + (i === gleich ? ' (wird aktualisiert)' : i === laeuft ? ' (läuft gerade – wird ersetzt)' : ' (wird ersetzt)') : 'frei'}`)));
  $('d-import-stunde').value = String(gleich >= 0 ? gleich : frei >= 0 ? frei : sonst);
  $('d-import-titel').textContent = gleich >= 0 ? 'Plan aktualisieren' : 'Plan übernehmen';
  $('d-import-text').textContent = `${fachAnzeige(p.fach)}${p.kurs.trim() ? ' · ' + p.kurs.trim() : ''}${p.thema.trim() ? ' · ' + p.thema.trim() : ''} · ${p.phasen.length} Phasen`;
  $('d-import').showModal();
}
function importUebernehmen() {
  const i = Number($('d-import-stunde').value);
  if (!eingang || !(i >= 0 && i < STUNDEN)) return;
  const p = eingang, update = S.stunden[i]?.pid === p.pid;
  if (!update && laufFrisch() && S.lauf.stunde === i && !confirm(`Die ${i + 1}. Stunde läuft gerade. Trotzdem ersetzen? Ihre Uhren beginnen dann von vorn.`)) return;
  eingang = null;
  $('d-import').close();
  S.aktiv = i; entwurf = null;
  if (update) { planAktualisieren(i, p); malEinrichten(); return; }
  // eine Kennung, eine Stunde: steht dieselbe pid schon in einem anderen Platz, bekommt die Kopie hier eine eigene
  if (S.stunden.some((x, k) => x && k !== i && x.pid === p.pid)) p.pid = neueId();
  S.stunden[i] = p;
  if (S.lauf?.stunde === i) S.lauf = null;
  speichere(true); malEinrichten();
}
/* Update einer Stunde, die dieses Gerät schon hat (gleiche pid). Die pid bleibt einem Platz über Tage treu — darum
   zwei Fälle (Fremdprüfung 2.3, Befund 1: sonst schrieb der Plan für morgen das Kurs-Gedächtnis der Stunde von heute um):
   · Die Stunde läuft gerade (auf der Bühne, oder ihr Lauf ist frisch und heute gestartet): Inhalt vom Handy, Lauf von hier.
     Uhren hängen an den Phasen-IDs und laufen weiter; eine geänderte Dauer verschiebt das Ende (kürzer als schon gelaufen:
     Ende jetzt, wie „− 1“). „blieb offen“ und „gelaufen“ bleiben die dieses Geräts.
   · Sonst ist es ein neuer Plan für diesen Platz, wie eine Übernahme: nicht gelaufen, nichts offen, kein alter Lauf. */
const fensterIds = P => ['start', 'heute', ...P.phasen.map(p => p.id), 'abschluss'];
const laeuftGerade = i => (buehneAn && i === S.aktiv) || (laufFrisch() && S.lauf.stunde === i && S.stunden[i]?.gelaufen === heute());
function planAktualisieren(i, neu) {
  const alt = S.stunden[i];
  if (!laeuftGerade(i)) {
    neu.phasen.forEach(p => { p.offen = false; });
    neu.gelaufen = '';
    S.stunden[i] = neu;
    if (S.lauf?.stunde === i) S.lauf = null;
    schreibe(true);
    return;
  }
  const offen = new Set(alt.phasen.filter(p => p.offen).map(p => p.id));
  // gleiche Stunde, aber neue IDs (am Handy Muster geladen, Ablauf zurückgesetzt …): eine Uhr, deren Phase fehlt, geht auf
  // die neue Phase an derselben Stelle über, wenn sie dieselbe Form hat (Befund 5)
  const altIds = new Set(alt.phasen.map(p => p.id)), neuIds = new Set(neu.phasen.map(p => p.id)), umbenannt = new Map();
  neu.phasen.forEach((p, k) => { const a = alt.phasen[k]; if (a && !neuIds.has(a.id) && !altIds.has(p.id) && a.typ === p.typ) umbenannt.set(a.id, p.id); });
  for (const [a, n] of umbenannt) {
    if (S.lauf.uhren[a] && !S.lauf.uhren[n]) { S.lauf.uhren[n] = S.lauf.uhren[a]; delete S.lauf.uhren[a]; }
    if (offen.has(a)) offen.add(n);
  }
  neu.phasen.forEach(p => { p.offen = offen.has(p.id); });
  neu.gelaufen = alt.gelaufen;
  S.stunden[i] = neu;
  // dieselbe Stelle im Ablauf, auch wenn davor Phasen dazukamen oder wegfielen; fiel sie selbst weg, die nächste alte
  // Stelle, die es noch gibt (Befund 4: sonst sprang die Bühne beim Löschen zweier Phasen auf den Abschluss)
  const altF = fensterIds(alt).map(id => umbenannt.get(id) ?? id), neuF = fensterIds(neu);
  const warId = altF[S.lauf.index], warUhr = S.lauf.uhren[warId];
  let j = -1;
  for (let k = S.lauf.index; k < altF.length && j < 0; k++) j = neuF.indexOf(altF[k]);
  S.lauf.index = j >= 0 ? j : neuF.length - 1;
  uhrenAnpassen(neu, S.lauf.index);
  // lief die aktuelle Phase und fiel weg: mit Selbstlauf beginnt die nachgerückte jetzt, sonst stünde die Stunde still
  const nach = neu.phasen.find(p => p.id === neuF[S.lauf.index]);
  if (!neuIds.has(warId) && warUhr?.ende != null && !warUhr.weiter && Date.now() < warUhr.ende && S.selbstlauf && nach && !S.lauf.uhren[nach.id]?.gestartet) {
    const nu = uhrFuer(nach.id, nach.min);
    nu.gestartet = true; nu.gemeldet = false; nu.ende = Date.now() + nu.rest;
  }
  kursMerken(i);
  schreibe(true);
  if (buehneAn && i === S.aktiv) buehneNeu();
}
function uhrenAnpassen(P, jetztIndex) {
  const jetzt = Date.now(), ids = fensterIds(P);
  for (const p of P.phasen) {
    const u = S.lauf.uhren[p.id];
    // nicht gestartete Uhren baut uhrFuer mit der neuen Dauer neu; von einer weitergeschalteten Uhr läuft schon die nächste;
    // Phasen vor der aktuellen sind vorbei und bleiben es (Befund 3: sonst lief eine abgelaufene wieder und klingelte zweimal)
    if (!u || !u.gestartet || u.weiter || u.plan === p.min || ids.indexOf(p.id) < jetztIndex) continue;
    const d = (p.min - u.plan) * 60e3;
    u.plan = p.min;
    if (u.ende != null) u.ende = d > 0 ? u.ende + d : Math.max(jetzt, u.ende + d);
    else { u.rest = Math.max(0, u.rest + d); if (!u.rest) u.ende = jetzt; }   // angehalten, aber schon länger als neu geplant: endet jetzt (Befund 8)
    u.gesamt = Math.max(p.min * 60e3, restVon(u));
    if (restVon(u) > 0) u.gemeldet = false;
  }
}

/* Meldung: auf der Bühne leise unten (liest die Klasse mit), in der Einrichtung als Hinweis */
let meldungTimer = 0;
function meldung(t) {
  if (!buehneAn) { alert(t); return; }
  const m = $('b-meldung');
  m.textContent = t; m.hidden = false;
  clearTimeout(meldungTimer);
  meldungTimer = setTimeout(() => { m.hidden = true; }, 3500);
}

/* ─── Scanner (2.3, Muster Werft-Arena guest.js): Kamera → BarcodeDetector, wo es ihn gibt, sonst jsQR (Apache-2.0,
   aus der Arena, erst beim ersten Scan geladen). Die Vorschau ist klein und unscharf: am Beamer gespiegelt soll
   niemand zu erkennen sein — gelesen wird das Kamerabild, nicht die Vorschau. ─── */
let scanStrom = null, scanLauf = 0, scanZiel = null;
function jsqrLaden() {
  if (window.jsQR) return Promise.resolve(true);
  return new Promise(fertig => {
    const s = document.createElement('script');
    s.src = './js/vendor/jsqr.js?v=' + APP_VERSION;
    s.onload = () => fertig(typeof window.jsQR === 'function');
    s.onerror = () => fertig(false);
    document.head.append(s);
  });
}
// Vorschau scharf/unscharf (Zero 2026-09-30 „Scharf per Tipp“): jeder neue Scan beginnt unscharf
function vorschauScharf(an) {
  const r = $('d-scan-rahmen');
  r.setAttribute('aria-pressed', String(an));
  r.setAttribute('aria-label', an ? 'Vorschau wieder unscharf' : 'Vorschau scharf zeigen');
  $('d-scan-tipp').textContent = an ? 'Tippen: unscharf' : 'Tippen: scharf';
}
function kameraAus() {
  scanLauf++;
  scanStrom?.getTracks().forEach(t => t.stop());
  scanStrom = null;
  $('d-scan-video').srcObject = null;
}
async function scannen(ziel) {
  const d = $('d-scan'), video = $('d-scan-video'), hinweis = $('d-scan-text');
  scanZiel = ziel;
  kameraAus();
  const lauf = scanLauf;
  hinweis.textContent = 'Kamera startet …';
  if (!d.open) { vorschauScharf(false); d.showModal(); }   // „Andere Kamera“ behält die Wahl, ein neuer Scan nicht
  if (!navigator.mediaDevices?.getUserMedia) { hinweis.textContent = 'In dieser Ansicht gibt es keinen Zugriff auf die Kamera.'; return; }
  let det = null;
  if ('BarcodeDetector' in window) try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch { det = null; }
  if (!det && !(await jsqrLaden())) { hinweis.textContent = 'Der Scanner ließ sich nicht laden.'; return; }
  // während des Ladens abgebrochen: dann auch keine Kamera anfragen (Befund 9). d.open gilt sofort, das close-Ereignis
  // (→ kameraAus) kommt erst als eigene Aufgabe — im Endlauf lud jsQR einmal schneller, und die Kamera wurde doch angefragt
  if (lauf !== scanLauf || !d.open) return;
  let strom;
  try { strom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.kamera, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { if (lauf === scanLauf) hinweis.textContent = `Die Kamera ließ sich nicht öffnen (${e?.name || 'Fehler'}). Erlaubnis in den Einstellungen prüfen.`; return; }
  if (lauf !== scanLauf || !d.open) { strom.getTracks().forEach(t => t.stop()); return; }   // inzwischen abgebrochen
  scanStrom = strom;
  video.srcObject = strom;
  try { await video.play(); } catch { /* spielt mit dem nächsten Bild */ }
  hinweis.textContent = 'Den QR-Code vom anderen Gerät vor die Kamera halten.';
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  let zuletzt = 0, fremd = false;
  const tick = async () => {
    if (lauf !== scanLauf) return;
    if (video.readyState >= 2 && performance.now() - zuletzt > 250) {
      zuletzt = performance.now();
      const w = video.videoWidth, hh = video.videoHeight, f = Math.min(1, 1024 / Math.max(w, hh));
      cv.width = Math.round(w * f); cv.height = Math.round(hh * f);
      g.drawImage(video, 0, 0, cv.width, cv.height);
      let txt = null;
      if (det) try { txt = (await det.detect(cv))[0]?.rawValue || null; } catch { det = null; jsqrLaden(); }
      if (!txt && !det && window.jsQR) txt = window.jsQR(g.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' })?.data || null;
      if (lauf !== scanLauf) return;
      if (txt) {
        const m = /#plan=[A-Za-z0-9_-]+/.exec(txt);
        if (m) { kameraAus(); d.close(); scanZiel?.(m[0]); return; }
        if (!fremd) { fremd = true; hinweis.textContent = 'Das ist kein Plan-Code aus dem Stundenverlauf.'; }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function musterLoeschen(i) {
  const m = S.muster[i];
  if (!m || !confirm(`Muster „${m.name}“ löschen?`)) return;
  S.muster.splice(i, 1);
  schreibe(); malMuster();
}

function malMaterial() {
  const P = plan();
  $('e-material').replaceChildren(...MATERIAL.map(([id, name]) => h('button', {
    type: 'button', class: 'mat-knopf', 'aria-pressed': String(P.material.includes(id)),
    onclick: () => {
      P.material = P.material.includes(id) ? P.material.filter(m => m !== id) : MATERIAL.map(m => m[0]).filter(m => m === id || P.material.includes(m));
      malMaterial(); speichere();
    },
  }, icon(id), h('span', {}, name))));
  $('e-eigen-liste').replaceChildren(...P.eigenes.map((name, i) => h('span', { class: 'chip' }, name,
    h('button', { type: 'button', 'aria-label': name + ' entfernen', onclick: () => { P.eigenes.splice(i, 1); malMaterial(); speichere(); } }, icon('x')))));
}
function eigenesHinzu() {
  const P = plan(), wert = $('e-eigen').value.trim().slice(0, 40);
  if (!wert || P.eigenes.length >= 8 || P.eigenes.includes(wert)) return;
  P.eigenes.push(wert); $('e-eigen').value = ''; malMaterial(); speichere();
}

function malPhasen() {
  const P = plan();
  let nr = 0;
  $('e-phasen').replaceChildren(...P.phasen.map((p, i) => {
    const pause = p.typ === 'pause';
    if (!pause) nr++;
    const kopf = h('div', { class: 'pz-kopf' },
      h('span', { class: 'nr', 'aria-hidden': 'true' }, pause ? icon('pause') : String(nr)),
      pause ? h('span', { class: 'pz-pause' }, 'Pause')
            : segment('typ-' + p.id, ARBEIT.map(t => [t, FORM[t].kurz]), p.typ, v => { p.typ = v; malPhasen(); speichere(); }, `Sozialform Arbeitsphase ${nr}`),
      h('div', { class: 'pz-aktionen' },
        h('button', { type: 'button', class: 'mini', 'aria-label': 'Nach oben', disabled: i === 0, onclick: () => schiebe(i, -1) }, icon('hoch')),
        h('button', { type: 'button', class: 'mini', 'aria-label': 'Nach unten', disabled: i === P.phasen.length - 1, onclick: () => schiebe(i, 1) }, icon('runter')),
        h('button', { type: 'button', class: 'mini', 'aria-label': 'Entfernen', onclick: () => { P.phasen.splice(i, 1); malPhasen(); speichere(); } }, icon('x'))));
    const werte = h('div', { class: 'pz-werte' },
      stepper(p.min, { min: 1, max: 120, schritt: 5, einheit: 'min', label: 'Dauer' }, v => { p.min = v; malBudget(); speichere(); }));
    if (p.typ === 'gruppe')
      werte.append(h('span', { class: 'pz-label' }, 'Gruppen zu'),
        stepper(p.groesse, { min: 3, max: 8, schritt: 1, einheit: '', label: 'Gruppengröße' }, v => { p.groesse = v; speichere(); }));
    // nach der Stunde (heute gelaufen): was nicht geschafft wurde, wandert in die nächste Stunde des Kurses
    if (!pause && P.gelaufen === heute())
      werte.append(h('button', { type: 'button', class: 'offen-knopf', 'aria-pressed': String(p.offen),
        onclick: () => { p.offen = !p.offen; malPhasen(); speichere(); } }, h('span', { class: 'kaestchen', 'aria-hidden': 'true' }, p.offen ? icon('fertig') : null), 'blieb offen'));
    return h('li', { class: 'phase-zeile' + (pause ? ' pause' : '') }, kopf, werte,
      pause ? null : auftragFeld(p.auftrag, { placeholder: 'Auftrag (optional) – z. B. Buch S. 42, Nr. 3–5', label: `Auftrag Arbeitsphase ${nr}`, max: 600, klasse: 'pz-auftrag' },
        v => { p.auftrag = v; speichere(); }),
      pause ? null : h('input', { type: 'text', class: 'pz-fertig', value: p.fertig, maxlength: '200', autocomplete: 'off',
        placeholder: 'Fertig? Dann … (optional) – z. B. Knobelaufgabe S. 45', 'aria-label': `Fertig-Auftrag Arbeitsphase ${nr}`,
        oninput: e => { p.fertig = e.target.value; speichere(); } }));
  }));
  malBudget();
}
function schiebe(i, d) {
  const P = plan(), j = i + d;
  if (j < 0 || j >= P.phasen.length) return;
  [P.phasen[i], P.phasen[j]] = [P.phasen[j], P.phasen[i]];
  malPhasen(); speichere();
}
function malPlus() {
  const neu = typ => { plan().phasen.push(neuePhase(typ, typ === 'pause' ? 5 : 15)); malPhasen(); speichere(); };
  $('e-plus').replaceChildren(...[...ARBEIT, 'pause'].map(t => h('button', { type: 'button', class: 'knopf', onclick: () => neu(t) }, '+ ' + FORM[t].kurz)));
}
function malRahmen() {
  const P = plan();
  $('e-einstieg').replaceChildren(h('span', { class: 'r-name' }, icon('start'), 'Eröffnung'),
    stepper(P.einstieg, { min: 0, max: 30, schritt: 5, einheit: 'min', label: 'Dauer der Eröffnung' }, v => { P.einstieg = v; malBudget(); speichere(); }));
  $('e-abschluss').replaceChildren(h('span', { class: 'r-name' }, icon('abschluss'), 'Abschluss'),
    stepper(P.abschluss.min, { min: 0, max: 45, schritt: 5, einheit: 'min', label: 'Dauer des Abschlusses' }, v => { P.abschluss.min = v; malBudget(); speichere(); }));
  $('e-ab-text').value = P.abschluss.text;
  $('e-ab-ha').replaceChildren(auftragFeld(P.abschluss.ha, { placeholder: 'Hausaufgabe (optional)', label: 'Hausaufgabe', max: 400 },
    v => { P.abschluss.ha = v; speichere(); }));
}
function malBudget() {
  const P = plan();
  const summe = P.einstieg + P.phasen.reduce((a, p) => a + p.min, 0) + P.abschluss.min;
  const rest = S.stunde - summe;
  $('e-stunde').value = String(S.stunde);
  $('e-summe').replaceChildren('Geplant ', h('b', {}, halb(summe) + ' min'));
  $('e-luft').textContent = rest >= 0 ? `${halb(rest)} min Luft` : `${halb(-rest)} min zu viel`;
  $('e-luft').classList.toggle('zuviel', rest < 0);
}
const laufFrisch = () => S.lauf && Date.now() - S.lauf.stand < LAUF_GUELTIG_MS;
function laufGueltig() { return laufFrisch() && S.lauf.stunde === S.aktiv; }
function malStart() {
  const knoepfe = [], n = S.aktiv + 1;
  if (laufGueltig()) {
    const f = bauFenster()[Math.min(S.lauf.index, bauFenster().length - 1)];
    knoepfe.push(h('button', { type: 'button', class: 'start', onclick: () => starteBuehne(false) }, icon('play'), `Zurück zur laufenden ${n}. Stunde · ${fensterName(f)}`));
    knoepfe.push(h('button', { type: 'button', class: 'start zweit', onclick: () => starteBuehne(true) }, 'Neu starten'));
  } else {
    knoepfe.push(h('button', { type: 'button', class: 'start', onclick: () => starteBuehne(true) }, icon('play'), `${n}. Stunde starten`));
  }
  $('e-start-reihe').replaceChildren(...knoepfe);
}

/* Tagesleiste: 1. bis 6. Stunde, jede in ihrer Fachfarbe */
function malTag() {
  $('e-tag').replaceChildren(...S.stunden.map((p, i) => {
    const b = h('button', { type: 'button', class: 'tag-knopf' + (i === S.aktiv ? ' an' : '') + (p ? '' : ' frei'),
      'aria-pressed': String(i === S.aktiv), onclick: () => waehleStunde(i) },
      h('span', { class: 'tag-nr' }, `${i + 1}.`),
      h('span', { class: 'tag-text' }, h('b', {}, p ? fachAnzeige(p.fach) + (p.kurs.trim() ? ' · ' + p.kurs.trim() : '') : 'frei'), p && p.thema.trim() ? h('span', {}, p.thema.trim()) : null),
      laufFrisch() && S.lauf.stunde === i ? h('span', { class: 'tag-laeuft', title: 'läuft' }) : null);
    if (p) { const [hue, stufe] = FAECHER[p.fach]; b.style.setProperty('--hue', String(hue)); b.style.setProperty('--stufe', String(stufe)); }
    return b;
  }));
}
function waehleStunde(i) {
  if (i === S.aktiv) return;
  S.aktiv = i; entwurf = null;
  schreibe(); malEinrichten();
  scrollTo(0, 0);
}
function malStundenKopf() {
  const n = S.aktiv + 1, belegt = !!S.stunden[S.aktiv];
  $('h-fach').textContent = `${n}. Stunde`;
  $('e-leeren').disabled = !belegt;
  $('e-kopie').replaceChildren(h('option', { value: '' }, 'Übernehmen aus …'),
    ...S.stunden.map((p, i) => p && i !== S.aktiv ? h('option', { value: String(i) }, `${i + 1}. Stunde · ${fachAnzeige(p.fach)}${p.thema.trim() ? ' · ' + p.thema.trim() : ''}`) : null));
  $('e-kopie').disabled = $('e-kopie').options.length < 2;
}
function malEinrichten() {
  setzeFarbe();
  const P = plan();
  $('e-fach').value = P.fach;
  $('e-kurs').value = P.kurs;
  $('e-lk').value = S.lehrkraft;
  $('e-thema').value = P.thema;
  $('e-modul').value = P.modul;
  $('e-ziel').value = P.ziel;
  malTag(); malStundenKopf(); malKursAngebot(); malAnzeige(); malMaterial(); malMuster(); malRahmen(); malPhasen(); malPlus(); malStart(); malWachHinweis();
}

function initEinrichten() {
  $('e-fach').replaceChildren(...FACH_LISTE.map(f => h('option', { value: f }, f)));
  $('e-fach').addEventListener('change', e => { plan().fach = e.target.value; speichere(); malEinrichten(); });
  $('e-kurs').addEventListener('input', e => { plan().kurs = e.target.value; speichere(); malKursAngebot(); });
  $('e-lk').addEventListener('input', e => { S.lehrkraft = e.target.value; schreibe(); });
  // Parallelklassen: ganze Stunde aus einer anderen übernehmen (Thema, Material, Ablauf, Aufträge) — der Kurs bleibt der eigene
  $('e-kopie').addEventListener('change', e => {
    const q = S.stunden[Number(e.target.value)], n = S.aktiv + 1;
    e.target.value = '';
    if (!q || (S.stunden[S.aktiv] && !confirm(`${n}. Stunde mit diesem Plan überschreiben?`))) return;
    const kopie = pruefePlan(JSON.parse(JSON.stringify(q)));
    kopie.pid = plan().pid;   // eine Kennung, eine Stunde: die Kopie gehört zu diesem Platz, nicht zur Quelle
    kopie.kurs = plan().kurs; kopie.gelaufen = '';
    kopie.phasen.forEach(p => { p.id = neueId(); p.offen = false; });
    S.stunden[S.aktiv] = kopie; entwurf = null;
    if (S.lauf?.stunde === S.aktiv) S.lauf = null;
    speichere(); malEinrichten();
  });
  $('e-leeren').addEventListener('click', () => {
    if (!confirm(`${S.aktiv + 1}. Stunde leeren? Alles, was hier eingetragen ist, wird gelöscht.`)) return;
    S.stunden[S.aktiv] = null; entwurf = null;
    if (S.lauf?.stunde === S.aktiv) S.lauf = null;
    schreibe(); malEinrichten();
  });
  $('e-thema').addEventListener('input', e => { plan().thema = e.target.value; speichere(); });
  $('e-modul').addEventListener('input', e => { plan().modul = e.target.value; speichere(); });
  $('e-ziel').addEventListener('input', e => { plan().ziel = e.target.value; speichere(); });
  $('e-ab-text').addEventListener('input', e => { plan().abschluss.text = e.target.value; speichere(); });
  $('e-eigen-plus').addEventListener('click', eigenesHinzu);
  $('e-weitergeben').addEventListener('click', weitergeben);
  $('e-holen').addEventListener('click', () => scannen(eingangLesen));
  // nach dem Schließen kehrt der Fokus auf „Update holen“ zurück — dann löste die Leertaste (Presenter, Tastatur)
  // den Scanner neu aus, statt die Uhr zu starten (Befund 10)
  $('d-scan').addEventListener('close', () => { kameraAus(); if (document.activeElement?.id === 'b-update') document.activeElement.blur(); });
  $('d-scan-zu').addEventListener('click', () => $('d-scan').close());
  $('d-scan-rahmen').addEventListener('click', () => vorschauScharf($('d-scan-rahmen').getAttribute('aria-pressed') !== 'true'));
  $('d-scan-kamera').addEventListener('click', () => { S.kamera = S.kamera === 'user' ? 'environment' : 'user'; schreibe(); scannen(scanZiel); });
  $('d-weiter-teilen').addEventListener('click', linkTeilen);
  $('d-weiter-zu').addEventListener('click', () => { $('d-weiter').close(); $('d-weiter-teilen').textContent = 'Link teilen'; });
  $('d-import-ja').addEventListener('click', importUebernehmen);
  $('d-import-nein').addEventListener('click', () => { eingang = null; $('d-import').close(); });
  addEventListener('hashchange', importPruefen);
  $('e-eigen').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); eigenesHinzu(); } });
  $('e-stunde').addEventListener('change', e => { S.stunde = Number(e.target.value); malBudget(); schreibe(); });
  $('e-reset').addEventListener('click', () => {
    if (!confirm(`Ablauf der ${S.aktiv + 1}. Stunde auf Standard zurücksetzen? Fach, Thema, Modul und Material bleiben.`)) return;
    const d = standardPlan(), P = plan();
    P.einstieg = d.einstieg; P.phasen = d.phasen; P.abschluss = d.abschluss;
    malEinrichten(); speichere();
  });
  malEinrichten();
}

/* ═══ Bühne: die Fenster ═══ */
let fensterListe = [];
let aktuell = 0;
let buehneAn = false;
let anzeige = null;          // Zeitscheibe des sichtbaren Fensters

function bauFenster() {
  const P = plan();
  const liste = [{ art: 'start', id: 'start' }, { art: 'heute', id: 'heute' }];
  let nr = 0;
  for (const p of P.phasen) {
    if (p.typ !== 'pause') nr++;
    liste.push({ art: 'phase', id: p.id, p, nr: p.typ === 'pause' ? null : nr });
  }
  liste.push({ art: 'abschluss', id: 'abschluss' });
  return liste;
}
function fensterName(f) {
  if (f.art === 'start') return 'Eröffnung';
  if (f.art === 'heute') return 'Thema';
  if (f.art === 'abschluss') return 'Abschluss';
  return f.p.typ === 'pause' ? 'Pause' : `Arbeitsphase ${f.nr}`;
}
const formName = p => p.typ === 'gruppe' ? `Gruppenarbeit (${p.groesse}er)` : FORM[p.typ].name;

/* Zeit: absolute Endzeit, damit die Uhr beim Blättern und nach Neuladen weiterläuft */
const uhren = () => S.lauf.uhren;
function uhrFuer(id, min) {
  let u = uhren()[id];
  if (!u || (!u.gestartet && u.plan !== min))
    u = uhren()[id] = { gesamt: min * 60e3, rest: min * 60e3, ende: null, plan: min, gestartet: false, gemeldet: false };
  return u;
}
const restVon = u => u.ende != null ? u.ende - Date.now() : u.rest;
function zustand(u) {
  const r = restVon(u);
  if (r <= 0 && u.gestartet) return 'um';
  if (u.ende != null) return 'laeuft';
  return u.gestartet ? 'halt' : 'bereit';
}
function uhrAktion(u, was) {
  const jetzt = Date.now();
  if (was === 'start' || was === 'weiter') { audioBereit(); u.gestartet = true; u.gemeldet = false; u.ende = jetzt + Math.max(0, u.rest); }
  else if (was === 'halt') { u.rest = Math.max(0, u.ende - jetzt); u.ende = null; }
  else if (was === 'neu') { u.gesamt = u.rest = u.plan * 60e3; u.ende = null; u.gestartet = false; u.gemeldet = false; }
  else if (was === 'plus' || was === 'minus') {
    const d = was === 'plus' ? 60e3 : -60e3;
    // +1 nach Zeitende zählt ab jetzt, nicht ab dem vergangenen Ende
    if (u.ende != null) u.ende = d > 0 ? Math.max(jetzt, u.ende) + d : Math.max(jetzt, u.ende + d);
    else u.rest = Math.max(0, u.rest + d);
    if (!u.gestartet) { u.rest = Math.max(60e3, u.rest); u.gesamt = u.rest; }
    const r = restVon(u);
    if (r > u.gesamt) u.gesamt = r;
    if (r > 0) u.gemeldet = false;
  }
  speichereLauf(); malUhr(); malVerlauf();
}
function hauptAktion() {
  if (!anzeige) return;
  const z = zustand(anzeige.u);
  if (z === 'bereit') uhrAktion(anzeige.u, 'start');
  else if (z === 'laeuft') uhrAktion(anzeige.u, 'halt');
  else if (z === 'halt') uhrAktion(anzeige.u, 'weiter');
}

function uhrBlock(id, min) {
  const u = uhrFuer(id, min);
  const zahlEl = h('b', {}), unter = h('p', { class: 'uhr-unter' }), knoepfe = h('div', { class: 'uhr-knoepfe' });
  const scheibe = h('div', { class: 'scheibe' }, h('div', { class: 'zahl', role: 'timer', 'aria-live': 'off' }, zahlEl, h('span', {}, 'min')));
  anzeige = { id, u, scheibe, zahlEl, unter, knoepfe, zustand: null };
  malUhr();
  return h('div', { class: 'uhr-block' }, scheibe, unter, knoepfe);
}
function malUhr() {
  if (!anzeige) return;
  const { u, scheibe, zahlEl, unter, knoepfe } = anzeige;
  const r = restVon(u), z = zustand(u);
  // letzte Minute: „Danach“ wird zu „Gleich“ und tritt hervor
  if (anzeige.danach) {
    const bald = z === 'laeuft' && r <= 60e3;
    anzeige.danach.classList.toggle('bald', bald);
    anzeige.danach.querySelector('.danach-wort').textContent = bald ? 'Gleich:' : 'Danach:';
  }
  scheibe.style.setProperty('--anteil', String(Math.max(0, Math.min(1, r / u.gesamt))));
  zahlEl.textContent = String(Math.max(0, Math.ceil(r / 60e3)));
  unter.textContent =
    z === 'laeuft' ? `bis ${ZEIT.format(u.ende)} Uhr` :
    z === 'halt' ? 'angehalten' :
    z === 'um' ? (r <= -60e3 ? `Zeit ist um · seit ${Math.floor(-r / 60e3)} min` : 'Zeit ist um') : ' ';
  if (z === anzeige.zustand) return;
  anzeige.zustand = z;
  const k = (was, inhalt, haupt = false, label = null) =>
    h('button', { type: 'button', class: 'u-knopf' + (haupt ? ' haupt' : ''), 'aria-label': label, onclick: () => uhrAktion(u, was) }, ...inhalt);
  const minus = k('minus', ['− 1'], false, 'Eine Minute weniger'), plus = k('plus', ['+ 1'], false, 'Eine Minute mehr');
  knoepfe.replaceChildren(...(
    z === 'bereit' ? [k('start', [icon('play'), 'Start'], true), minus, plus] :
    z === 'laeuft' ? [k('halt', [icon('halt'), 'Anhalten']), minus, plus] :
    z === 'halt' ? [k('weiter', [icon('play'), 'Weiter'], true), minus, plus, k('neu', [icon('neu')], false, 'Zurücksetzen')] :
    // hat der Selbstlauf schon weitergeschaltet, liefe „+ 1“ neben der nächsten Phase her — dann nur Zurücksetzen
    [u.weiter ? null : plus, k('neu', [icon('neu')], false, 'Zurücksetzen')].filter(Boolean)));
}

function fensterInhalt(f) {
  const P = plan();
  anzeige = null;
  if (f.art === 'start') {
    const mat = [...P.material.map(id => [id, MAT_NAME[id]]), ...P.eigenes.map(n => ['eigenes', n])];
    return h('div', { class: 'f-start' },
      h('p', { class: 'f-kicker' }, DATUM.format(new Date())),
      h('h1', { class: 'f-titel' }, 'Willkommen in ', h('span', { class: 'fachwort' }, fachAnzeige())),
      S.lehrkraft.trim() ? h('p', { class: 'f-unter' }, 'bei ' + S.lehrkraft.trim()) : null,
      mat.length ? [
        h('h2', { class: 'f-abschnitt' }, 'Du benötigst heute:'),
        h('ul', { class: 'mat-reihe' }, mat.map(([ic, name]) => h('li', { class: 'mat-kachel' }, icon(ic), name))),
      ] : null);
  }
  if (f.art === 'heute') {
    const thema = P.thema.trim(), modul = P.modul.trim();
    // Stichpunkte (Zero 2026-09-30: „ganz kurz“, „ohne Mehraufwand“): die erste Zeile des Auftrags, gekürzt.
    // Sobald eine Phase einen hat, ersetzen sie das „zuerst/dann“ — die Reihenfolge trägt die Liste selbst.
    const stich = [...P.phasen.map(p => p.typ === 'pause' ? '' : stichpunkt(p.auftrag)), stichpunkt(P.abschluss.text)];
    const mitStich = stich.some(Boolean);
    const zeile = (wann, ic, name, min, s) => h('li', {}, icon(ic),
      h('span', { class: 'was' }, mitStich ? null : h('span', { class: 'wann' }, wann), h('span', { class: 'name' }, name), s ? h('span', { class: 'stich' }, s) : null),
      h('span', { class: 'dauer' }, min ? min + ' min' : ''));
    const zeilen = P.phasen.map((p, i) => zeile(i === 0 ? 'zuerst' : 'dann', p.typ, formName(p), p.min, stich[i]));
    zeilen.push(zeile('zum Schluss', 'abschluss', 'Abschluss', P.abschluss.min, stich.at(-1)));
    const ziel = P.ziel.trim();
    return h('div', { class: 'f-heute' },
      h('div', {},
        h('p', { class: 'f-kicker' }, thema ? 'Heute ist Thema' : 'Heute'),
        h('h1', { class: 'f-titel' }, thema || modul || 'So läuft die Stunde'),
        thema && modul ? h('p', { class: 'f-modul' }, icon('modul'), modul) : null,
        ziel ? h('p', { class: 'f-ziel' }, icon('ziel'), h('span', {}, h('b', {}, 'Ziel'), ziel)) : null),
      h('div', {},
        h('p', { class: 'f-kicker' }, 'So arbeitest du heute'),
        h('ol', { class: 'ablauf' + (zeilen.length > 6 ? ' dicht' : '') }, zeilen)));
  }
  if (f.art === 'phase') {
    const p = f.p, stufe = FORM[p.typ].laut;
    // die drei Fragen der Klasse: Was mache ich? (Titel, Auftrag) · Wie lange noch? (Scheibe) · Was kommt danach? (Zeile unten)
    const naechstes = fensterListe[fensterListe.indexOf(f) + 1];
    const danach = naechstes && naechstes.art === 'phase'
      ? h('p', { class: 'danach' }, icon('danach'), h('span', { class: 'danach-wort' }, 'Danach:'), h('span', {}, `${formName(naechstes.p)} · ${naechstes.p.min} min`))
      : naechstes ? h('p', { class: 'danach' }, icon('danach'), h('span', { class: 'danach-wort' }, 'Danach:'), h('span', {}, 'Abschluss')) : null;
    // „Danach“ steht unter der Zeitscheibe — dort schaut die Klasse hin, und hochkant ist neben der Scheibe Platz
    const block = uhrBlock(p.id, p.min);
    if (danach) block.append(danach);
    anzeige.danach = danach;
    malUhr();
    return h('div', { class: 'f-phase' },
      h('div', {},
        h('p', { class: 'f-kicker' }, p.typ === 'pause' ? 'Zwischendurch' : `Arbeitsphase ${f.nr}`),
        h('div', { class: 'soz' }, icon(p.typ), h('h1', { class: 'f-titel' }, FORM[p.typ].name)),
        h('div', { class: 'hinweis-zeile' },
          h('p', { class: 'hinweis' }, FORM[p.typ].hinweis(p)),
          stufe == null ? null : h('p', { class: 'laut', 'data-stufe': String(stufe), 'aria-label': 'Lautstärke: ' + LAUT[stufe] },
            icon(stufe === 0 ? 'still' : 'laut'),
            h('span', { class: 'balken', 'aria-hidden': 'true' }, [1, 2, 3].map(n => h('i', { class: n <= stufe ? 'an' : '' }))),
            h('span', {}, LAUT[stufe]))),
        p.auftrag.trim() ? auftragKasten('Auftrag', p.auftrag) : null,
        p.fertig.trim() ? h('div', { class: 'fertig' }, h('b', {}, icon('fertig'), 'Fertig? Dann'), h('p', {}, p.fertig.trim())) : null),
      block);
  }
  // Abschluss ohne Uhr (Zero 2026-09-30) — seine Minuten zählen nur für die Planung
  const ab = P.abschluss;
  return h('div', { class: 'f-phase ohne-uhr' },
    h('div', {},
      h('p', { class: 'f-kicker' }, 'Zum Schluss'),
      h('div', { class: 'soz' }, icon('abschluss'), h('h1', { class: 'f-titel' }, 'Abschluss')),
      h('p', { class: 'hinweis' }, ab.text.trim() || ABSCHLUSS_STANDARD),
      ab.ha.trim() ? auftragKasten('Hausaufgabe', ab.ha) : null));
}

function malVerlauf() {
  const ol = $('b-verlauf');
  ol.replaceChildren(...fensterListe.map((f, i) => {
    const u = uhren()[f.id], z = u ? zustand(u) : null;
    const kurz = f.art === 'phase' ? `${FORM[f.p.typ].kurz}${f.p.typ === 'gruppe' ? ' (' + f.p.groesse + ')' : ''} · ${f.p.min}′`
      : f.art === 'start' ? 'Start' : f.art === 'heute' ? 'Thema' : 'Abschluss';
    const ic = f.art === 'phase' ? f.p.typ : f.art;
    return h('li', { class: 'b-schritt' + (i === aktuell ? ' jetzt' : i < aktuell ? ' vorbei' : '') + (z === 'laeuft' && i !== aktuell ? ' laeuft' : '') },
      h('button', { type: 'button', 'aria-current': i === aktuell ? 'step' : null, 'aria-label': fensterName(f), onclick: () => zeigeFenster(i) }, icon(ic), h('span', {}, kurz)));
  }));
  ol.children[aktuell]?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

const VT = typeof document.startViewTransition === 'function';
if (VT) document.documentElement.classList.add('vt');
const RUHIG = matchMedia('(prefers-reduced-motion: reduce)');
function zeigeFenster(i) {
  const ziel = Math.max(0, Math.min(fensterListe.length - 1, i));
  const wechsel = ziel !== aktuell && $('b-fenster').childElementCount > 0;
  document.documentElement.dataset.richtung = ziel >= aktuell ? 'vor' : 'zurueck';
  aktuell = ziel;
  const malen = () => {
    const inhalt = fensterInhalt(fensterListe[aktuell]);
    // Reihenfolge des Erscheinens = Lesereihenfolge; der Titel in .soz kommt mit seinem Symbol
    [...inhalt.querySelectorAll('.f-kicker, .f-titel, .f-unter, .f-abschnitt, .f-modul, .f-ziel, .mat-kachel, .ablauf li, .soz, .hinweis, .laut, .auftrag, .fertig, .uhr-block')]
      .filter(e => !e.parentElement.closest('.soz'))
      .forEach((e, n) => { e.classList.add('stufe'); e.style.setProperty('--i', String(Math.min(n, 12))); });
    $('b-fenster').replaceChildren(inhalt);
    $('b-vor').disabled = aktuell === 0;
    $('b-weiter').disabled = aktuell === fensterListe.length - 1;
    malVerlauf();
    speichereLauf();
  };
  if (wechsel && VT && !RUHIG.matches && document.visibilityState === 'visible') {
    // schnelles Blättern überspringt den laufenden Übergang — das ist gewollt, kein Fehler
    document.startViewTransition(malen).ready.catch(() => {});
  } else malen();
}
function speichereLauf() { if (S.lauf) { S.lauf.index = aktuell; S.lauf.stand = Date.now(); speichere(); } }

function starteBuehne(neu) {
  audioBereit();
  // für „blieb offen“ und das Kurs-Gedächtnis; läuft der Plan an einem neuen Tag, gelten alte „offen“-Marken nicht mehr
  const P = plan();
  if (P.gelaufen !== heute()) P.phasen.forEach(p => { p.offen = false; });
  P.gelaufen = heute();
  speichere();   // eine gestartete Stunde ist belegt, auch ohne Eintrag
  kursMerken(S.aktiv, true);
  schreibe();
  if (neu || !laufGueltig()) S.lauf = { stunde: S.aktiv, index: 0, uhren: Object.create(null), stand: Date.now() };
  fensterListe = bauFenster();
  aktuell = Math.min(S.lauf.index, fensterListe.length - 1);
  malBuehnenKopf();
  $('einrichten').hidden = true;
  $('buehne').hidden = false;
  document.documentElement.classList.add('auf-buehne');
  buehneAn = true;
  scrollTo(0, 0);
  wachHalten();
  takt();
  zeigeFenster(aktuell);
}
function malBuehnenKopf() {
  $('b-fach').textContent = fachAnzeige() + (plan().kurs.trim() ? ' · ' + plan().kurs.trim() : '');
  $('b-lk').textContent = S.lehrkraft.trim() ? ' · ' + S.lehrkraft.trim() : '';
}
/* Update vom Handy während der Stunde: Fenster neu aus dem Plan, gleiche Stelle (S.lauf.index hat planAktualisieren
   schon umgerechnet), kein Übergang — für die Klasse ändert sich nur der Inhalt */
function buehneNeu() {
  fensterListe = bauFenster();
  aktuell = Math.min(S.lauf?.index ?? aktuell, fensterListe.length - 1);
  setzeFarbe();
  malBuehnenKopf();
  zeigeFenster(aktuell);
}
function zurEinrichtung() {
  buehneAn = false;
  anzeige = null;
  $('buehne').hidden = true;
  $('einrichten').hidden = false;
  document.documentElement.classList.remove('auf-buehne');
  wachLassen();
  vollbildAus();
  malEinrichten();
}

/* Selbstlauf (Zero 2026-09-30, ab dem Start der 1. Phase): ist eine gestartete Phase abgelaufen, startet die nächste —
   mit Ende = voriges Ende + ihre Minuten, nicht ab „jetzt“. So stimmen Phase und Restzeit auch, wenn die Seite
   eine Weile nicht lief (anderes Fenster, App-Wechsel). Angehaltene Uhren (ende = null) halten die Kette an.
   Von jeder Uhr aus wird genau einmal weitergeschaltet (u.weiter) — ein späteres Zurücksetzen startet nichts neu.
   Läuft hinter ihr schon eine Phase, die die Lehrkraft von Hand gestartet hat, bleibt die Kette stehen.
   Gibt das Fenster zurück, das jetzt dran ist, oder -1, wenn sich nichts bewegt hat. */
function selbstlauf() {
  if (!S.selbstlauf) return -1;
  const jetzt = Date.now();
  let ziel = -1;
  for (let i = 0; i < fensterListe.length - 1; i++) {
    const f = fensterListe[i], u = f.art === 'phase' ? uhren()[f.id] : null;
    if (!u || u.weiter || !u.gestartet || u.ende == null || jetzt < u.ende) continue;
    u.weiter = true;
    if (fensterListe.slice(i + 1).some(g => g.art === 'phase' && uhren()[g.id]?.gestartet)) continue;
    const n = fensterListe[i + 1];
    if (n.art === 'phase') { const nu = uhrFuer(n.id, n.p.min); nu.gestartet = true; nu.gemeldet = false; nu.ende = u.ende + nu.rest; }
    ziel = i + 1;   // nächste Phase oder, nach der letzten, der Abschluss
  }
  return ziel;
}
/* Selbstlauf mitten in der Stunde einschalten: längst abgelaufene Uhren schalten nicht mehr weiter */
function selbstlaufAb() {
  if (!S.lauf) return;
  for (const u of Object.values(S.lauf.uhren)) if (u.ende != null && Date.now() >= u.ende) u.weiter = true;
}

/* Takt: Uhrzeit, Zeitscheibe, Signal bei Zeitende — auch für eine Uhr, deren Fenster gerade nicht sichtbar ist */
function takt() {
  if (!buehneAn) return;
  $('b-uhr').textContent = ZEIT.format(Date.now());
  const weiter = selbstlauf();
  // nur Uhren von Phasen, die es im Ablauf noch gibt — eine gelöschte Phase gibt kein Signal mehr
  const gueltig = new Set(fensterListe.map(f => f.id));
  let neuUm = false;
  for (const [id, u] of Object.entries(uhren())) {
    if (gueltig.has(id) && u.ende != null && !u.gemeldet && Date.now() >= u.ende) {
      u.gemeldet = true; neuUm = true;
      if (anzeige && anzeige.id === id) {
        anzeige.scheibe.classList.remove('klingt'); void anzeige.scheibe.offsetWidth; anzeige.scheibe.classList.add('klingt');
      }
    }
  }
  // ein Signal je Takt, auch wenn beim Aufholen mehrere Phasen zugleich enden
  if (neuUm) gong();
  // nur vorwärts: wer vorausgeblättert hat (z. B. zum Abschluss), wird nicht zurückgeholt
  if (weiter > aktuell) { zeigeFenster(weiter); return; }
  malUhr();
  if (neuUm || weiter >= 0) { malVerlauf(); speichereLauf(); }
}
setInterval(takt, 1000);

/* Signal: zwei weiche Töne, im Browser erzeugt (keine Datei). Braucht einen Tipp vorher — Start genügt. */
let ac = null;
function audioBereit() {
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch { ac = null; }
}
function gong() {
  if (!S.signal || !ac) return;
  const t = ac.currentTime;
  for (const [f, d] of [[659.25, 0], [880, .38]]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t + d);
    g.gain.exponentialRampToValueAtTime(.22, t + d + .03);
    g.gain.exponentialRampToValueAtTime(.0001, t + d + 1.8);
    o.connect(g).connect(ac.destination);
    o.start(t + d); o.stop(t + d + 1.9);
  }
}

/* Bildschirm wach halten, solange die Fenster laufen (iPad/Beamer darf nicht dunkel werden).
   In eingebetteten Ansichten (HTML-Viewer-App, Dateianzeige der Lernplattform) sperrt die Sandbox das —
   dann sagt die Einrichtung, wie man die Auto-Sperre von Hand ausschaltet. */
let sperre = null;
let wachGeht = 'wakeLock' in navigator;
try { if (window.self !== window.top) wachGeht = false; } catch { wachGeht = false; }
function malWachHinweis() { $('e-wach').hidden = wachGeht; }
async function wachHalten() {
  try {
    if (buehneAn && !sperre && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      sperre = await navigator.wakeLock.request('screen');
      sperre.addEventListener('release', () => { sperre = null; });
    }
  } catch { sperre = null; wachGeht = false; }
}
function wachLassen() { try { sperre?.release(); } catch {} sperre = null; }
function vollbildAus() {
  if (!(document.fullscreenElement || document.webkitFullscreenElement)) return;
  try { const p = (document.exitFullscreen || document.webkitExitFullscreen).call(document); p?.catch?.(() => {}); } catch {}
}
// verborgen (App-Wechsel, anderer Tab): der Scanner schließt, damit die Kamera nicht im Hintergrund an bleibt (Befund 11)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wachHalten(); takt(); }
  else if ($('d-scan').open) $('d-scan').close();
});

function initBuehne() {
  $('b-vor').append(icon('links'));
  $('b-weiter').append(icon('rechts'));
  $('b-zurueck').append(icon('zahnrad'));
  $('b-update').append(icon('scan'));
  $('b-update').addEventListener('click', () => scannen(hash => eingangLesen(hash, true)));
  $('b-vor').addEventListener('click', () => zeigeFenster(aktuell - 1));
  $('b-weiter').addEventListener('click', () => zeigeFenster(aktuell + 1));
  $('b-zurueck').addEventListener('click', zurEinrichtung);

  // Vollbild: in der Home-Bildschirm-App unnötig (schon randlos), in Sandbox-Ansichten abgelehnt — beides still
  const de = document.documentElement;
  const randlos = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if ((de.requestFullscreen || de.webkitRequestFullscreen) && !randlos) {
    $('b-vollbild').append(icon('vollbild'));
    $('b-vollbild').addEventListener('click', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) { vollbildAus(); return; }
      try { const p = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); p?.catch?.(() => {}); } catch {}
    });
  } else $('b-vollbild').hidden = true;

  // iOS hält den Ton nach einem App-Wechsel an — jeder Tipp auf die Bühne weckt ihn wieder
  $('buehne').addEventListener('pointerdown', audioBereit);

  // Wischen links/rechts blättert (iPad); Tipps auf Knöpfe zählen nicht
  let wisch = null;
  const flaeche = $('b-fenster');
  flaeche.addEventListener('pointerdown', e => { wisch = e.target.closest('button') ? null : { x: e.clientX, y: e.clientY }; });
  flaeche.addEventListener('pointerup', e => {
    if (!wisch) return;
    const dx = e.clientX - wisch.x, dy = e.clientY - wisch.y;
    wisch = null;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 60) zeigeFenster(aktuell + (dx < 0 ? 1 : -1));
  });
  flaeche.addEventListener('pointercancel', () => { wisch = null; });

  // Tastatur und Presenter: Pfeile/Bild auf-ab blättern, Leertaste/Enter startet oder hält die Uhr
  document.addEventListener('keydown', e => {
    if (!buehneAn || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); zeigeFenster(aktuell + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); zeigeFenster(aktuell - 1); }
    else if (k === 'Home') { e.preventDefault(); zeigeFenster(0); }
    else if (k === 'End') { e.preventDefault(); zeigeFenster(fensterListe.length - 1); }
    else if ((k === ' ' || k === 'Enter') && !e.target.closest('button, input, select')) { e.preventDefault(); hauptAktion(); }
  });
}

initEinrichten();
initBuehne();
if (pidNeu) schreibe(true);   // Stand vor 2.3: die neuen Kennungen gleich festhalten
importPruefen();   // mit #plan=… geöffnet (Kamera-App, geteilter Link): Plan übernehmen oder Stunde aktualisieren

/* PWA: offline über den Service Worker. Ein Update wird nur in der Einrichtung angeboten, nie mitten in der Stunde. */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Nur melden, wenn schon eine Fassung lief: beim allerersten Besuch übernimmt der Worker die Seite (clients.claim)
  // und wäre danach ebenfalls „Controller“ — das ist keine neue Version (2.2, am Bild des ersten Handy-Besuchs gesehen)
  const warSchon = !!navigator.serviceWorker.controller;
  addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).then(reg => {
      const melde = () => { if (warSchon) $('e-neu').hidden = false; };
      reg.addEventListener('updatefound', () => {
        const neu = reg.installing;
        neu?.addEventListener('statechange', () => { if (neu.state === 'activated' && navigator.serviceWorker.controller) melde(); });
      });
    }).catch(() => {});
  });
  $('e-neu-laden').addEventListener('click', () => location.reload());
}
