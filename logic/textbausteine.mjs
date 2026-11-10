// Stundenverlauf · logic/textbausteine.mjs — Textbausteine auswählen, Lücken füllen, in ein Feld einfügen, eigene anlegen,
// Nutzung zählen. Zero 10.11.: „Das Eintippen aller Aufträge wird viel, wenn man es ordentlich machen will, und genau dagegen
// war die App ja eigentlich, wir brauchen also ein System, was vieles sinnvoll vorausfüllt.“
// Mitgelieferte Bausteine kommen aus bausteine_daten.mjs, im Speicher stehen nur eigene und Zähler (Konzept §9).
import { FAECHER } from './konstanten.mjs?v=3.0.0';
import { hat, zahl } from './plan.mjs?v=3.0.0';

/* Feldgrenzen wie in pruefePlan der App (Auftrag 600, Fertig 200, Ziel 160, Abschluss 160, Hausaufgabe 400) */
export const GRENZEN = Object.freeze({ auftrag: 600, fertig: 200, ziel: 160, abschluss: 160, ha: 400, luecke: 40, kuerzel: 12 });
export const GRUPPEN = Object.freeze(['auftrag', 'fertig', 'ziel', 'abschluss', 'ha']);
export const EIGEN_MAX = 60, ZAEHLER_MAX = 200, ZAEHLER_HOCH = 9999, SICHTBAR = 6, ZULETZT = 3;

const LUECKE = /\{([A-Za-z0-9]+)\}/g;
const gueltigeBausteinId = s => typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s);

/* ─── Auswahl ─── */
/* Alle Bausteine in fester Reihenfolge: gemeinsame, dann die des Fachs, dann eigene (eigene ohne Fach gelten überall) */
export function bausteineFuer(daten, { fach = '', gruppe, form = '', eigen = [] } = {}) {
  const fachListe = fach && daten?.faecher && hat(daten.faecher, fach) ? daten.faecher[fach].bausteine || [] : [];
  const eigeneHier = eigen.filter(b => !b.fach || b.fach === fach);
  return [...(daten?.gemeinsam?.bausteine || []), ...fachListe, ...eigeneHier]
    .filter(b => b.gruppe === gruppe && (!form || !b.formen || b.formen.includes(form)));
}

/* Reihenfolge „zuletzt und oft genutzt zuerst“: erst die ZULETZT jüngst genutzten (neueste vorn), dann nach Zahl der
   Nutzungen, dann wie in den Daten. Der Zähler ist ein Objekt in Nutzungsreihenfolge (zaehle() setzt die ID ans Ende).
   Gleiche Eingabe ergibt gleiche Reihenfolge. */
export function ordne(liste, zaehler = {}) {
  const reihe = Object.keys(zaehler);
  const jung = reihe.slice(-ZULETZT).reverse();
  const platz = new Map(liste.map((b, i) => [b.id, i]));
  const rang = b => { const j = jung.indexOf(b.id); return j >= 0 ? j : ZULETZT; };
  return liste.slice().sort((a, b) => rang(a) - rang(b) || (zaehler[b.id] || 0) - (zaehler[a.id] || 0) || platz.get(a.id) - platz.get(b.id));
}
/* Die ersten sechs für die Chips, der Rest für „Mehr“ */
export const teile = (geordnet, n = SICHTBAR) => ({ sichtbar: geordnet.slice(0, n), mehr: geordnet.slice(n) });

/* ─── Lücken und Einfügen ─── */
export const lueckenVon = b => [...new Set([...(b.text || '').matchAll(LUECKE)].map(m => m[1]))];

/* werte: { X: 'Raum 2' }. Jede Lücke braucht einen Wert (getrimmt, höchstens GRENZEN.luecke Zeichen), sonst null. */
export function fuelle(b, werte = {}) {
  const fehlt = lueckenVon(b).some(n => typeof werte[n] !== 'string' || !werte[n].trim() || werte[n].trim().length > GRENZEN.luecke);
  if (fehlt) return null;
  return b.text.replace(LUECKE, (_, n) => werte[n].trim());
}

/* Einzeilige Felder der App (Fertig und Abschluss sind <input>, das Ziel ein Satz): dort hängt ein Leerzeichen an,
   ein Zeilenumbruch würde vom Feld gestrichen und klebte die Sätze zusammen (P11-Prüfer 10.11.) */
export const EINZEILIG = Object.freeze(['fertig', 'ziel', 'abschluss']);

/* Text in ein Feld einfügen: leeres Feld → der Text, sonst als neue Zeile darunter (einzeilig: mit Leerzeichen dahinter).
   Über der Feldgrenze wird nichts abgeschnitten: Ergebnis { text: alt, ok: false }, die Oberfläche sagt es. */
export function einfuegen(feld, neu, gruppe) {
  const grenze = GRENZEN[gruppe];
  if (!grenze || typeof neu !== 'string' || !neu.trim()) return { text: feld || '', ok: false };
  const alt = typeof feld === 'string' ? feld : '';
  const text = alt.trim() ? alt.replace(/\s+$/, '') + (EINZEILIG.includes(gruppe) ? ' ' : '\n') + neu : neu;
  return text.length <= grenze ? { text, ok: true } : { text: alt, ok: false };
}

/* ─── Zähler ─── */
/* Nutzung zählen: ID ans Ende (jüngste), Zahl + 1 bis ZAEHLER_HOCH; mehr als ZAEHLER_MAX IDs → die ältesten fallen weg */
export function zaehle(zaehler, id) {
  if (!gueltigeBausteinId(id)) return zaehler;
  const n = Math.min(ZAEHLER_HOCH, (zaehler[id] || 0) + 1);
  const neu = Object.create(null);
  for (const [k, v] of Object.entries(zaehler)) if (k !== id) neu[k] = v;
  neu[id] = n;
  const ids = Object.keys(neu);
  for (const k of ids.slice(0, Math.max(0, ids.length - ZAEHLER_MAX))) delete neu[k];
  return neu;
}
/* Beim Laden: Objekt mit gültigen IDs und ganzen Zahlen 0 bis 9 999, Reihenfolge bleibt; falscher Typ → leer */
export function pruefeZaehler(z) {
  const neu = Object.create(null);
  if (!z || typeof z !== 'object' || Array.isArray(z)) return neu;
  for (const [k, v] of Object.entries(z)) if (gueltigeBausteinId(k) && Number.isFinite(v)) neu[k] = Math.round(zahl(v, 0, ZAEHLER_HOCH, 0));
  const ids = Object.keys(neu);
  for (const k of ids.slice(0, Math.max(0, ids.length - ZAEHLER_MAX))) delete neu[k];
  return neu;
}

/* ─── Eigene Bausteine ─── */
/* Ein eigener Baustein: { id, gruppe, fach ('' = alle Fächer), kuerzel, text }. Ungültig → null. */
export function pruefeEigen(b) {
  if (!b || typeof b !== 'object' || !GRUPPEN.includes(b.gruppe) || typeof b.text !== 'string' || !b.text.trim()) return null;
  if (b.text.length > GRENZEN[b.gruppe] || !gueltigeBausteinId(b.id) || !b.id.startsWith('e-')) return null;
  const fach = typeof b.fach === 'string' && hat(FAECHER, b.fach) ? b.fach : '';
  const kuerzel = (typeof b.kuerzel === 'string' && b.kuerzel.trim() ? b.kuerzel.trim() : b.text.trim()).slice(0, GRENZEN.kuerzel);
  return { id: b.id, gruppe: b.gruppe, fach, kuerzel, text: b.text };
}
export const pruefeEigene = arr => {
  if (!Array.isArray(arr)) return [];
  const ids = new Set();
  return arr.map(pruefeEigen).filter(b => b && !ids.has(b.id) && ids.add(b.id)).slice(0, EIGEN_MAX);
};

/* Anlegen: neueId wird gereicht (Tests deterministisch). Ergebnis { eigen, fehler }; fehler: 'voll', 'leer', 'zu lang', 'gruppe' */
export function eigenAnlegen(eigen, { gruppe, fach = '', kuerzel = '', text }, neueId) {
  if (eigen.length >= EIGEN_MAX) return { eigen, fehler: 'voll' };
  if (!GRUPPEN.includes(gruppe)) return { eigen, fehler: 'gruppe' };
  if (typeof text !== 'string' || !text.trim()) return { eigen, fehler: 'leer' };
  if (text.length > GRENZEN[gruppe]) return { eigen, fehler: 'zu lang' };
  let id; do { id = 'e-' + neueId(); } while (eigen.some(b => b.id === id));
  const b = pruefeEigen({ id, gruppe, fach, kuerzel, text });
  return b ? { eigen: [...eigen, b], fehler: null } : { eigen, fehler: 'leer' };
}
export const eigenLoeschen = (eigen, id) => eigen.filter(b => b.id !== id);
