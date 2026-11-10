// Stundenverlauf · logic/stundenplan.mjs — Stundenplan je Wochentag (Zero 10.11.: „die Stundenplan-Idee ist nicht schlecht“).
// Ein Eintrag je Wochentag (1 Montag bis 5 Freitag) und Platz (1. bis 6. Stunde): { fach, kurs, typ }.
// Ohne A/B-Wochen (Zero 10.11.: „Keine A/B-Woche“): Jeder Eintrag gilt jede Woche.
import { FAECHER, STUNDEN } from './konstanten.mjs?v=3.0.1';
import { hat, text, standardPlan } from './plan.mjs?v=3.0.1';
import { typVon, planAusTyp } from './stundentypen.mjs?v=3.0.1';

export const TAGE = ['1', '2', '3', '4', '5'];

export function leererStundenplan() {
  const p = {};
  for (const t of TAGE) p[t] = Array(STUNDEN).fill(null);
  return p;
}

/* Ein Eintrag beim Laden: unbekanntes Fach → kein Eintrag; Kurs höchstens 20 Zeichen; unbekannter Typ → '' */
export function pruefeEintrag(e, typIds = new Set()) {
  if (!e || typeof e !== 'object' || !hat(FAECHER, e.fach)) return null;
  const typ = text(e.typ, 40);
  return { fach: e.fach, kurs: text(e.kurs, 20).trim(), typ: typIds.has(typ) ? typ : '' };
}
/* Ganzer Stundenplan beim Laden; falscher Typ (Text, Liste) → leer */
export function pruefeStundenplan(o, typIds = new Set()) {
  const p = leererStundenplan();
  if (!o || typeof o !== 'object' || Array.isArray(o)) return p;
  for (const t of TAGE) if (Array.isArray(o[t])) for (let i = 0; i < STUNDEN; i++) p[t][i] = pruefeEintrag(o[t][i], typIds);
  return p;
}

/* Wochentag aus einem Datum (gereicht, nicht aus der Uhr): '1' bis '5', Wochenende → null */
export function wochentag(datum) {
  const d = datum.getDay();
  return d >= 1 && d <= 5 ? String(d) : null;
}

/* Eintrag setzen oder löschen (null); gibt einen neuen Stundenplan zurück, der alte bleibt unverändert */
export function setzeEintrag(plan, tag, platz, eintrag, typIds) {
  if (!TAGE.includes(String(tag)) || !Number.isInteger(platz) || platz < 0 || platz >= STUNDEN) return plan;
  const neu = { ...plan, [tag]: plan[tag].slice() };
  neu[tag][platz] = eintrag == null ? null : pruefeEintrag(eintrag, typIds);
  return neu;
}
export const loescheEintrag = (plan, tag, platz) => setzeEintrag(plan, tag, platz, null);

/* Gilt ein Eintrag an diesem Datum? Immer, es gibt keine A/B-Wochen */
export const eintragGilt = (e) => !!e;

/* Entwurf für einen leeren Platz: Fach und Kurs aus dem Stundenplan, mit Stundentyp dessen Ablauf.
   daten: bausteine_daten (für den Typ), stundeMin: Länge der Stunde, muster: eigene Muster (ein überschriebener Typ gilt). */
export function entwurfFuer(eintrag, daten, stundeMin, muster) {
  const basis = standardPlan(eintrag.fach);
  basis.kurs = eintrag.kurs;
  const typ = eintrag.typ ? typVon(daten, eintrag.fach, eintrag.typ, muster) : null;
  return typ ? planAusTyp(typ, basis, stundeMin).plan : basis;
}

/* „Tag anlegen“: belegt nur freie Plätze (null) mit dem Entwurf aus dem Stundenplan des Tages; belegte Plätze bleiben
   dasselbe Objekt. Ergebnis { stunden, belegt: [Plätze] }; am Wochenende oder ohne Einträge: nichts. */
export function tagAnlegen(stunden, plan, datum, daten, stundeMin, muster) {
  const tag = wochentag(datum);
  if (!tag) return { stunden, belegt: [] };
  const neu = stunden.slice(), belegt = [];
  for (let i = 0; i < STUNDEN; i++) {
    const e = plan[tag]?.[i];
    if (neu[i] == null && eintragGilt(e, datum)) { neu[i] = entwurfFuer(e, daten, stundeMin, muster); belegt.push(i); }
  }
  return belegt.length ? { stunden: neu, belegt } : { stunden, belegt };
}
