// Stundenverlauf · logic/konstanten.mjs — feste Tabellen der App: Fächer, Material, Sozialformen, Grenzen des Speichers.
// Ohne DOM, damit Node-Tests und Ansichten dieselben Werte sehen.

/* ─── Fachfarben: [Farbton, Helligkeitsstufe] je Fach, übernommen aus der Kladde
   (Klausurkorrektur/kladde/app/logic/fachfarben.mjs, FAECHER, Stand v1.10.1). ─── */
export const FAECHER = {
  'Mathematik': [252, 0], 'Physik': [36, 0], 'Informatik': [144, 0], 'Chemie': [168, 1], 'Biologie': [108, 0],
  'NW': [312, 1], 'Technik': [336, 1], 'Deutsch': [84, 1], 'Englisch': [300, 0], 'Spanisch': [12, 1],
  'Französisch': [132, 0], 'Latein': [324, 0], 'Geschichte': [156, 0], 'Philosophie': [276, 0],
  'Praktische Philosophie': [96, 1], 'Pädagogik': [240, 1], 'Sozialwissenschaften': [348, 0],
  'Gesellschaftslehre': [60, 1], 'Politik': [252, 1], 'Erdkunde': [0, 0], 'Wirtschaft': [264, 1],
  'Kunst': [204, 1], 'Musik': [264, 0], 'Sport': [192, 1], 'Hauswirtschaft': [12, 0], 'Religion': [216, 1],
  'Katholische Religion': [120, 0], 'Evangelische Religion': [324, 1], 'Arbeitslehre': [180, 1],
  'Darstellen und Gestalten': [72, 1],
};
export const FACH_LISTE = Object.keys(FAECHER).sort((a, b) => a.localeCompare(b, 'de'));
export const ANZEIGE = { 'Mathematik': 'Mathe' };   // so, wie man es in der Klasse sagt

export const MATERIAL = [
  ['ipad', 'iPad'], ['buch', 'Buch'], ['heft', 'Heft'], ['mappe', 'Mappe'], ['schreibzeug', 'Schreibzeug'],
  ['buntstifte', 'Buntstifte'], ['lineal', 'Lineal'], ['geodreieck', 'Geodreieck'], ['zirkel', 'Zirkel'],
  ['taschenrechner', 'Taschenrechner'], ['schere', 'Schere'], ['kleber', 'Kleber'],
  ['arbeitsblatt', 'Arbeitsblatt'], ['kopfhoerer', 'Kopfhörer'],
];
export const MAT_NAME = Object.fromEntries(MATERIAL);

/* laut = Stufe des Lautstärke-Zeichens (Zero 2026-09-30: Einzel still · Partner flüstern · Gruppe leise · Plenum eine Person) */
export const FORM = {
  einzel:  { name: 'Einzelarbeit',  kurz: 'Einzel',  laut: 0,    hinweis: () => 'Du arbeitest allein und still.' },
  partner: { name: 'Partnerarbeit', kurz: 'Partner', laut: 1,    hinweis: () => 'Ihr arbeitet zu zweit und flüstert.' },
  gruppe:  { name: 'Gruppenarbeit', kurz: 'Gruppe',  laut: 2,    hinweis: p => `Ihr arbeitet in ${p.groesse}er-Gruppen mit leiser Stimme.` },
  plenum:  { name: 'Plenum',        kurz: 'Plenum',  laut: 3,    hinweis: () => 'Wir arbeiten alle zusammen. Eine Person spricht, alle hören zu.' },
  pause:   { name: 'Pause',         kurz: 'Pause',   laut: null, hinweis: () => 'Kurz durchatmen – gleich geht es weiter.' },
};
export const LAUT = ['still', 'flüstern', 'leise', 'eine Person spricht'];
export const ARBEIT = ['einzel', 'partner', 'gruppe', 'plenum'];
export const ABSCHLUSS_STANDARD = 'Wir sichern gemeinsam, was du heute gelernt hast.';

/* Speicher: Schlüssel und Grenzen (Format in logic/speicher.mjs) */
export const SCHLUESSEL = 'stundenverlauf.v2';
export const STUNDEN = 6;
export const LAUF_GUELTIG_MS = 4 * 3600e3;
export const MUSTER_MAX = 20, KURSE_MAX = 40;
// IDs reisen seit 2.3 mit (Link, QR): nur Kleinbuchstaben und Ziffern, und nie der Name eines festen Fensters
export const FENSTER_FEST = new Set(['start', 'heute', 'abschluss']);

export const formName = p => p.typ === 'gruppe' ? `Gruppenarbeit (${p.groesse}er)` : FORM[p.typ].name;
export const halb = v => Number.isInteger(v) ? String(v) : Math.floor(v) + '½';
