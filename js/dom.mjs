// Stundenverlauf · js/dom.mjs — gemeinsame DOM-Helfer: Element bauen, Element holen, Linien-Icons.
// Text kommt immer als Textknoten in die Seite, nie als HTML.

export const $ = id => document.getElementById(id);
export function h(tag, attrs = {}, ...kinder) {
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

/* Kurze Meldung unten (#e-meldung, popover: liegt auch über einem offenen Blatt), verschwindet nach 2,5 s */
let meldeTimer = 0;
export function melde(text) {
  const m = $('e-meldung');
  if (!m) return;
  m.textContent = text;
  m.hidden = false;
  try { m.hidePopover?.(); m.showPopover?.(); } catch { /* ohne Popover bleibt es ein Absatz */ }
  clearTimeout(meldeTimer);
  meldeTimer = setTimeout(() => { try { m.hidePopover?.(); } catch { /* schon zu */ } m.hidden = true; }, 2500);
}

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
  stift: '<path d="M4.5 19.5l1-4L15.6 5.4a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8.5 18.5z"/><path d="M13.8 7.2l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><rect x="8" y="8" width="3" height="3" rx=".5"/><rect x="13" y="8" width="3" height="3" rx=".5"/><rect x="8" y="13" width="3" height="3" rx=".5"/><path d="M13.5 13.5H16V16"/>',
};
const ICON_CACHE = {};
export function icon(name) {
  if (!ICON_CACHE[name]) {
    const t = document.createElement('template');
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + (PFADE[name] || PFADE.eigenes) + '</svg>';
    ICON_CACHE[name] = t.content.firstElementChild;
  }
  return ICON_CACHE[name].cloneNode(true);
}
