// Stundenverlauf · logic/uhren.mjs — Fenster der Bühne, Uhren der Phasen, Selbstlauf. Ohne DOM; die Zeit kommt aus Date.now().
/* Zeit: absolute Endzeit, damit die Uhr beim Blättern und nach Neuladen weiterläuft.
   Uhr = {gesamt, rest, ende (ms | null), plan (min), gestartet, gemeldet, weiter}; sie hängt im Lauf an der Phasen-ID. */
import { FORM, LAUF_GUELTIG_MS } from './konstanten.mjs?v=3.0.1';

/* Fenster der Bühne in Reihenfolge: Eröffnung, Thema, je Phase eines, Abschluss */
export function bauFenster(P) {
  const liste = [{ art: 'start', id: 'start' }, { art: 'heute', id: 'heute' }];
  let nr = 0;
  for (const p of P.phasen) {
    if (p.typ !== 'pause') nr++;
    liste.push({ art: 'phase', id: p.id, p, nr: p.typ === 'pause' ? null : nr });
  }
  liste.push({ art: 'abschluss', id: 'abschluss' });
  return liste;
}
export function fensterName(f) {
  if (f.art === 'start') return 'Eröffnung';
  if (f.art === 'heute') return 'Thema';
  if (f.art === 'abschluss') return 'Abschluss';
  return f.p.typ === 'pause' ? 'Pause' : `Arbeitsphase ${f.nr}`;
}
/* Beschriftung in der Leiste: Name und, bei Phasen, Minuten getrennt — die Ansicht trennt sie durch Abstand und Gewicht,
   nie durch einen Malpunkt (Zero: Malpunkt nur als Rechenzeichen) */
export const fensterKurz = f => f.art === 'phase'
  ? { name: `${FORM[f.p.typ].kurz}${f.p.typ === 'gruppe' ? ' (' + f.p.groesse + ')' : ''}`, min: `${f.p.min}′` }
  : { name: f.art === 'start' ? 'Start' : f.art === 'heute' ? 'Thema' : 'Abschluss', min: '' };
export const fensterIds = P => ['start', 'heute', ...P.phasen.map(p => p.id), 'abschluss'];

export const laufFrisch = S => S.lauf && Date.now() - S.lauf.stand < LAUF_GUELTIG_MS;
export const neuerLauf = stunde => ({ stunde, index: 0, uhren: Object.create(null), stand: Date.now() });

export function uhrFuer(lauf, id, min) {
  let u = lauf.uhren[id];
  if (!u || (!u.gestartet && u.plan !== min))
    u = lauf.uhren[id] = { gesamt: min * 60e3, rest: min * 60e3, ende: null, plan: min, gestartet: false, gemeldet: false };
  return u;
}
export const restVon = u => u.ende != null ? u.ende - Date.now() : u.rest;
export function zustand(u) {
  const r = restVon(u);
  if (r <= 0 && u.gestartet) return 'um';
  if (u.ende != null) return 'laeuft';
  return u.gestartet ? 'halt' : 'bereit';
}
/* was: start · weiter · halt · neu · plus · minus */
export function uhrAktion(u, was) {
  const jetzt = Date.now();
  if (was === 'start' || was === 'weiter') { u.gestartet = true; u.gemeldet = false; u.ende = jetzt + Math.max(0, u.rest); }
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
}
/* Hauptknopf (Leertaste, Presenter): bereit → Start, läuft → Anhalten, angehalten → Weiter; sonst nichts */
export const hauptWas = z => ({ bereit: 'start', laeuft: 'halt', halt: 'weiter' })[z] || null;

/* Selbstlauf (Zero 2026-09-30, ab dem Start der 1. Phase): ist eine gestartete Phase abgelaufen, startet die nächste —
   mit Ende = voriges Ende + ihre Minuten, nicht ab „jetzt“. So stimmen Phase und Restzeit auch, wenn die Seite
   eine Weile nicht lief (anderes Fenster, App-Wechsel). Angehaltene Uhren (ende = null) halten die Kette an.
   Von jeder Uhr aus wird genau einmal weitergeschaltet (u.weiter) — ein späteres Zurücksetzen startet nichts neu.
   Läuft hinter ihr schon eine Phase, die die Lehrkraft von Hand gestartet hat, bleibt die Kette stehen.
   Gibt das Fenster zurück, das jetzt dran ist, oder -1, wenn sich nichts bewegt hat. */
export function selbstlauf(S, fensterListe) {
  if (!S.selbstlauf) return -1;
  const jetzt = Date.now(), uhren = () => S.lauf.uhren;
  let ziel = -1;
  for (let i = 0; i < fensterListe.length - 1; i++) {
    const f = fensterListe[i], u = f.art === 'phase' ? uhren()[f.id] : null;
    if (!u || u.weiter || !u.gestartet || u.ende == null || jetzt < u.ende) continue;
    u.weiter = true;
    if (fensterListe.slice(i + 1).some(g => g.art === 'phase' && uhren()[g.id]?.gestartet)) continue;
    const n = fensterListe[i + 1];
    if (n.art === 'phase') { const nu = uhrFuer(S.lauf, n.id, n.p.min); nu.gestartet = true; nu.gemeldet = false; nu.ende = u.ende + nu.rest; }
    ziel = i + 1;   // nächste Phase oder, nach der letzten, der Abschluss
  }
  return ziel;
}
/* Selbstlauf mitten in der Stunde einschalten: längst abgelaufene Uhren schalten nicht mehr weiter */
export function selbstlaufAb(S) {
  if (!S.lauf) return;
  for (const u of Object.values(S.lauf.uhren)) if (u.ende != null && Date.now() >= u.ende) u.weiter = true;
}
/* Uhren, deren Zeit jetzt um ist und die noch nicht gemeldet haben — nur Phasen, die es im Ablauf noch gibt
   (eine gelöschte Phase gibt kein Signal mehr). Markiert sie als gemeldet und gibt ihre IDs zurück. */
export function neuAbgelaufen(S, fensterListe) {
  const gueltig = new Set(fensterListe.map(f => f.id)), ids = [];
  for (const [id, u] of Object.entries(S.lauf.uhren)) {
    if (gueltig.has(id) && u.ende != null && !u.gemeldet && Date.now() >= u.ende) {
      u.gemeldet = true; ids.push(id);
    }
  }
  return ids;
}

/* Geänderte Dauern in einen laufenden Lauf übernehmen (Update vom Handy) */
export function uhrenAnpassen(S, P, jetztIndex) {
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

/* Schreiben auf der Bühne (3.0): Während der Lehrer im Auftragsfeld oder im Einfüge-Blatt schreibt, blättert der
   Selbstlauf nicht. Er merkt sich sein Ziel als Fenster-ID (ein Einfügen verschiebt die Indexe) und holt es danach nach.
   weiter = Ergebnis von selbstlauf(); Rückgabe {ziel: Index, zu dem jetzt geblättert wird, oder -1; aufgeschoben: neue ID | null} */
export function nachSelbstlauf(fensterListe, aktuell, weiter, aufgeschoben, schreibt) {
  const stelle = id => fensterListe.findIndex(f => f.id === id);
  // nur vorwärts: wer vorausgeblättert hat (z. B. zum Abschluss), wird nicht zurückgeholt
  if (weiter > aktuell && (aufgeschoben == null || weiter > stelle(aufgeschoben))) aufgeschoben = fensterListe[weiter].id;
  if (schreibt || aufgeschoben == null) return { ziel: -1, aufgeschoben };
  const z = stelle(aufgeschoben);
  return { ziel: z > aktuell ? z : -1, aufgeschoben: null };
}
