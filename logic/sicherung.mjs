// Stundenverlauf · logic/sicherung.mjs — Pläne, Muster, eigene Bausteine und Stundenplan als Datei sichern und zurückholen
// (Konzept §10). Schutz vor dem Rückwechsel auf eine ältere Fassung und vor Gerätewechsel. Ohne laufende Stunde und Kamera:
// beides gehört zum Gerät, nicht zur Planung. Eingelesen wird mit denselben Prüfungen wie beim Laden (leseStand + erweitereStand).
import { FAECHER } from './konstanten.mjs?v=3.0.1';
import { hat } from './plan.mjs?v=3.0.1';
import { leseStand } from './speicher.mjs?v=3.0.1';
import { erweitereStand } from './stand_v3.mjs?v=3.0.1';
import { tageZahl } from './tage.mjs?v=3.0.1';

export const FORMAT = 'stundenverlauf-sicherung', FASSUNG = 1, GROESSE_MAX = 2 * 1024 * 1024;
const zweistellig = n => String(n).padStart(2, '0');
const datumIso = d => `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}`;

/* s: Stand der App; jetzt: Date (gereicht); app: Fassung der App. Ergebnis { name, text } für Teilen oder Download. */
export function sicherungAus(s, jetzt, app) {
  const { lauf, kamera, ...daten } = s;
  const obj = { format: FORMAT, fassung: FASSUNG, app, stand: jetzt.toISOString(), daten };
  return { name: `stundenverlauf-sicherung-${datumIso(jetzt)}.json`, text: JSON.stringify(obj) };
}

/* Fächer, die in der Datei stehen, aber die App nicht kennt: dann ist die Datei fremd oder beschädigt */
function fremdeFaecher(d) {
  const f = [];
  const pruef = (x, wo) => { if (x && typeof x === 'object' && x.fach != null && x.fach !== '' && !hat(FAECHER, x.fach)) f.push(wo); };
  (Array.isArray(d.stunden) ? d.stunden : []).forEach((p, i) => pruef(p, `Stunde ${i + 1}`));
  Object.entries(d.tage && typeof d.tage === 'object' ? d.tage : {}).forEach(([t, l]) => (Array.isArray(l) ? l : []).forEach((p, i) => pruef(p, `${t}/${i + 1}`)));
  Object.entries(d.kurse && typeof d.kurse === 'object' ? d.kurse : {}).forEach(([k, v]) => pruef(v?.plan, `Kurs ${k}`));
  Object.entries(d.plan && typeof d.plan === 'object' ? d.plan : {}).forEach(([t, l]) => (Array.isArray(l) ? l : []).forEach((e, i) => pruef(e, `Stundenplan ${t}/${i + 1}`)));
  return f;
}

/* text: Inhalt der gewählten Datei. Ergebnis { ok: true, stand, kopf } oder { ok: false, grund }; bei false wird nichts ersetzt. */
export function pruefeSicherung(text, typIds = new Set()) {
  if (typeof text !== 'string' || !text) return { ok: false, grund: 'leer' };
  if (new TextEncoder().encode(text).length > GROESSE_MAX) return { ok: false, grund: 'zu groß' };
  let o;
  try { o = JSON.parse(text); } catch { return { ok: false, grund: 'keine lesbare Sicherung' }; }
  if (!o || o.format !== FORMAT) return { ok: false, grund: 'falsches Format' };
  if (o.fassung !== FASSUNG) return { ok: false, grund: 'unbekannte Fassung' };
  if (!o.daten || typeof o.daten !== 'object' || Array.isArray(o.daten) || !Array.isArray(o.daten.stunden)) return { ok: false, grund: 'ohne Daten' };
  if (typeof o.stand !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(o.stand)) return { ok: false, grund: 'ohne Datum' };
  const fremd = fremdeFaecher(o.daten);
  if (fremd.length) return { ok: false, grund: 'unbekanntes Fach: ' + fremd.join(', ') };
  const roh = JSON.stringify(o.daten);
  const stand = erweitereStand(leseStand(roh).s, roh, typIds);
  return { ok: true, stand, kopf: { stand: o.stand, app: typeof o.app === 'string' ? o.app.slice(0, 20) : '' } };
}

/* Vorschau für die Rückfrage: „Sicherung vom 10.11.2026, 3 Tage, 16 Stunden, 14 Kurse, 5 Muster, 12 Einträge im Stundenplan,
   3 eigene Bausteine“. Sie nennt alles, was „Alles ersetzen“ ersetzt; Stunden zählen über alle Tage (logic/tage.mjs). */
export function vorschau(stand, kopf) {
  const [j, m, t] = kopf.stand.slice(0, 10).split('-');
  const zahl = (n, eins, mehr) => `${n} ${n === 1 ? eins : mehr}`;
  const imPlan = Object.values(stand.plan).flat().filter(Boolean).length;
  const stunden = [stand.stunden, ...Object.values(stand.tage || {})].flat().filter(Boolean).length;
  return `Sicherung vom ${t}.${m}.${j}, ${zahl(tageZahl(stand), 'Tag', 'Tage')}, ${zahl(stunden, 'Stunde', 'Stunden')}, `
    + `${zahl(Object.keys(stand.kurse).length, 'Kurs', 'Kurse')}, ${zahl(stand.muster.length, 'Muster', 'Muster')}, `
    + `${zahl(imPlan, 'Eintrag im Stundenplan', 'Einträge im Stundenplan')}, `
    + `${zahl(stand.bausteine.eigen.length, 'eigener Baustein', 'eigene Bausteine')}`;
}

/* Zusammenführen. art 'alles': alles aus der Sicherung, die Kamera bleibt die dieses Geräts; eine laufende Stunde endet,
   denn ihre Uhren gehörten zu den alten Stunden (P11-Prüfer 10.11.).
   art 'muster': Muster und eigene Bausteine samt Zählern werden durch die gesicherten ersetzt (so heißt der Knopf:
   „Nur Muster und Bausteine“); Stunden, Kurse, Stundenplan und Lauf bleiben unberührt. */
export function zusammenfuehren(aktuell, gesichert, art) {
  if (art === 'alles') return { ...gesichert, lauf: null, kamera: aktuell.kamera };
  if (art === 'muster') return { ...aktuell, muster: gesichert.muster, bausteine: gesichert.bausteine };
  return aktuell;
}
