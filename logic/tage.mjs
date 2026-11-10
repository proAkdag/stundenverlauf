// Stundenverlauf · logic/tage.mjs — Tage: zwischen ihnen wechseln, kommende voraus füllen, vergangene ansehen, Ausfall.
// Zero 10.11.: „Und gibt es eine Möglichkeit, zwischen den Tagen zu wechseln? 1. Damit ich vorausfüllen kann. 2. Die alten
// Stunden besuchen kann, um zu sehen, was ich gemacht habe (mit Option ausgefallen).“
/* Im Stand S (logic/speicher.mjs): S.stunden ist der angezeigte Tag, S.tag sein Datum ('JJJJ-MM-TT'), S.tage alle anderen
   Tage (Datum → sechs Plätze). So arbeitet jede Ansicht weiter mit S.stunden[S.aktiv]. Leere Tage stehen nicht in S.tage.
   Ein Lauf gehört zu seinem Tag: Zeigt die Einrichtung einen anderen Tag, liegt er in park { tag, lauf } (js/zustand.mjs lage.park),
   S.lauf ist dann null — so trifft S.lauf.stunde nie einen Platz eines fremden Tags.
   Gespeichert wird immer der Heimattag als S.stunden (fuerSpeicher): der Tag des frischen Laufs, sonst heute. So liest die 2.3.4
   nach einem Rückwechsel die Stunden von heute, und der Lauf wird beim Laden an seinen eigenen Stunden geprüft.
   Ausfall am Plan: ausfall 'offen' (fällt aus, Angebot an die nächste Stunde des Kurses) | 'nachgeholt' (Angebot übernommen);
   ohne Ausfall fehlt das Feld, so bleibt ein alter Plan Byte für Byte, wie er war.
   Das Feld lebt nur an den Plätzen der Tage; pruefePlan kennt es nicht, darum fällt es bei Kopie, Link und Kurs-Gedächtnis weg.
   Muster abgeschaut von der Kladde (kladde/app/logic/stunden.mjs, autowahl.mjs entfallZurueck, js/ansichten/stundenplan.mjs
   schultagAb), nichts importiert: Schultag für Schultag blättern, „Fällt aus“ und „Ausfall zurücknehmen“. Ohne DOM. */
import { STUNDEN } from './konstanten.mjs?v=3.0.0';
import { heute, hatGetipptes, kursSchluessel, neueId, pruefePlan } from './plan.mjs?v=3.0.0';
import { laufFrisch } from './uhren.mjs?v=3.0.0';

export const AUSFALL = ['offen', 'nachgeholt'];
const zwei = n => String(n).padStart(2, '0');
export const isoVon = d => `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
/* Date am Mittag des Tages (Mittag: keine Sommerzeit-Kante), nur für gültige Daten */
export const datumVon = iso => { const [j, m, t] = iso.split('-').map(Number); return new Date(j, m - 1, t, 12); };
/* Gültiges Datum: Form JJJJ-MM-TT und ein echter Kalendertag (2031-13-45 und 2026-02-30 nicht) */
export function istDatum(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(s)) return false;
  const [j, m, t] = s.split('-').map(Number), d = new Date(j, m - 1, t, 12);
  return d.getFullYear() === j && d.getMonth() === m - 1 && d.getDate() === t;
}
/* Nächster oder voriger Schultag (Mo–Fr), Wochenende übersprungen — wie schultagAb der Kladde */
export function schultagAb(iso, richtung) {
  const d = datumVon(iso);
  do d.setDate(d.getDate() + richtung); while (d.getDay() === 0 || d.getDay() === 6);
  return isoVon(d);
}
export const leer = stunden => stunden.every(p => p == null);
const leererTag = () => Array(STUNDEN).fill(null);
/* Ausfall aus dem Speicher an den Plan hängen: nur ein bekannter Wert, sonst kein Feld */
const haengeAusfall = (p, v) => { if (AUSFALL.includes(v)) p.ausfall = v; else delete p.ausfall; return p; };

/* Ein Tag aus dem Speicher: genau sechs Plätze, sonst verworfen; ein Platz ist null oder ein Plan (pruefePlan), mit Ausfall */
function pruefeTag(l) {
  if (!Array.isArray(l) || l.length !== STUNDEN) return null;
  const t = l.map(p => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    return haengeAusfall(pruefePlan(p), p.ausfall);
  });
  return leer(t) ? null : t;
}
export function pruefeTage(o, ohne) {
  const tage = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return tage;
  for (const [d, l] of Object.entries(o)) {
    if (!istDatum(d) || d === ohne) continue;
    const t = pruefeTag(l);
    if (t) tage[d] = t;
  }
  return tage;
}

/* Beim Laden (logic/stand_v3.mjs erweitereStand): s = Ergebnis von leseStand, o = der rohe Stand. Ohne gültiges tag (Stand der
   2.3.4 oder der 3.0.0 vom 10.11.) gelten die Stunden als heute. Der Ausfall der Stunden steht nur im rohen Stand. */
export function leseTage(s, o, jetzt = heute()) {
  s.stunden.forEach((p, i) => { if (p) haengeAusfall(p, o.stunden?.[i]?.ausfall); });
  s.tag = istDatum(o.tag) ? o.tag : jetzt;
  s.tage = pruefeTage(o.tage, s.tag);
  return s;
}

/* Heimattag: der Tag des frischen Laufs (angezeigt oder geparkt), sonst heute */
export function heimat(S, park, jetzt = heute()) {
  if (S.lauf && laufFrisch(S)) return S.tag;
  if (park?.lauf && laufFrisch({ lauf: park.lauf })) return park.tag;
  return jetzt;
}
/* Was in den Speicher geht: der Heimattag als stunden, der angezeigte Tag (wenn nicht leer) in tage, der Lauf an seinem Tag */
export function fuerSpeicher(S, park, jetzt = heute()) {
  const h = heimat(S, park, jetzt), lauf = S.lauf || park?.lauf || null;
  if (S.tag === h) return { ...S, lauf };
  const tage = { ...S.tage };
  if (!leer(S.stunden)) tage[S.tag] = S.stunden;
  const stunden = tage[h] || leererTag();
  delete tage[h];
  return { ...S, stunden, tag: h, tage, lauf };
}

/* Tag wechseln: der angezeigte Tag geht nach S.tage (leer: weg), der Ziel-Tag wird S.stunden. Der Lauf parkt an seinem Tag. */
export function wechsleTag(S, ziel, park) {
  if (!istDatum(ziel) || ziel === S.tag) return false;
  if (S.lauf && park) { park.tag = S.tag; park.lauf = S.lauf; S.lauf = null; }
  if (leer(S.stunden)) delete S.tage[S.tag]; else S.tage[S.tag] = S.stunden;
  S.stunden = S.tage[ziel] || leererTag();
  delete S.tage[ziel];
  S.tag = ziel;
  if (park?.lauf && park.tag === ziel) { S.lauf = park.lauf; park.lauf = null; park.tag = ''; }
  return true;
}
export const vergangen = (S, jetzt = heute()) => S.tag < jetzt;
export const istHeute = (S, jetzt = heute()) => S.tag === jetzt;
/* Zahl der Tage mit Stunden (für die Vorschau der Sicherung) */
export const tageZahl = S => (leer(S.stunden) ? 0 : 1) + Object.keys(S.tage || {}).length;

/* Nichts verschwindet still: Stunden mit Getipptem, die nie gestartet wurden und nicht ausfallen, vom jüngsten Tag vor heute,
   der solche hat — zurück bis zum letzten Schultag (am Montag also Sonntag, Samstag, Freitag: wer am Sonntagabend unter „heute“
   für Montag tippt, findet es am Montag). Nur am heutigen Tag. Leere Einträge aus „Tag anlegen“ zählen nicht (Durchspiel 10.11., R1).
   tag = dieser Tag (ohne Fund der letzte Schultag); passend = die Plätze davon, die heute frei sind; frei heißt auch: dort steht
   nur ein Eintrag ohne Getipptes. */
const offenGetippt = p => p && !p.gelaufen && !p.ausfall && hatGetipptes(p);
export function ungestartete(S, jetzt = heute()) {
  const grenze = schultagAb(jetzt, -1);
  const tag = S.tag !== jetzt ? grenze
    : Object.keys(S.tage).filter(d => d < jetzt && d >= grenze && S.tage[d].some(offenGetippt)).sort().pop() || grenze;
  const l = S.tag === jetzt ? S.tage[tag] : null;
  const plaetze = l ? l.map((p, i) => (offenGetippt(p) ? i : -1)).filter(i => i >= 0) : [];
  const frei = q => q == null || (!q.gelaufen && !q.ausfall && !hatGetipptes(q));
  return { tag, plaetze, passend: plaetze.filter(i => frei(S.stunden[i])) };
}
/* Auf dieselben Plätze von heute holen; belegte Plätze bleiben, was nicht passt, bleibt am alten Tag. Ergebnis: geholte Plätze */
export function aufHeuteHolen(S, jetzt = heute()) {
  const { tag, passend } = ungestartete(S, jetzt);
  for (const i of passend) { S.stunden[i] = S.tage[tag][i]; S.tage[tag][i] = null; }
  if (S.tage[tag] && leer(S.tage[tag])) delete S.tage[tag];
  return passend;
}

/* Ausfall setzen oder zurücknehmen — zurücknehmen löscht auch „nachgeholt“ (die übernommene Kopie bleibt, wo sie ist) */
export function setzeAusfall(P, an) { haengeAusfall(P, an ? 'offen' : ''); }

/* Angebot an eine Stunde P am angezeigten Tag: die jüngste ausgefallene Stunde desselben Fachs und Kurses an einem früheren Tag,
   deren Angebot noch offen ist. P selbst fällt nicht aus und lief noch nicht. Ergebnis { tag, platz, plan } oder null. */
export function ausfallAngebot(S, P) {
  const schl = P && !P.ausfall && !P.gelaufen ? kursSchluessel(P.kurs, P.fach) : '';
  if (!schl) return null;
  const frueher = Object.keys(S.tage).filter(d => d < S.tag).sort().reverse();
  for (const d of frueher) {
    const i = S.tage[d].findIndex(q => q && q.ausfall === 'offen' && kursSchluessel(q.kurs, q.fach) === schl);
    if (i >= 0) return { tag: d, platz: i, plan: S.tage[d][i] };
  }
  return null;
}
/* Übernehmen: Thema, Modul, Ziel, Material, Ablauf, Aufträge und Abschluss der ausgefallenen Stunde; P behält Kennung und Kurs.
   Danach ist das Angebot weg (die ausgefallene Stunde heißt „nachgeholt“). */
export function ausfallUebernehmen(a, P) {
  const neu = pruefePlan({ ...structuredClone(a.plan), pid: P.pid, kurs: P.kurs, gelaufen: '' });
  neu.phasen.forEach(p => { p.id = neueId(); p.offen = false; });
  a.plan.ausfall = 'nachgeholt';
  return neu;
}

/* Ein eingehender Plan (Link, QR), dessen pid an einem anderen Tag liegt: Ergebnis { tag, platz } oder null */
export function pidAnderswo(S, pid) {
  for (const [d, l] of Object.entries(S.tage)) {
    const i = l.findIndex(q => q && q.pid === pid);
    if (i >= 0) return { tag: d, platz: i };
  }
  return null;
}
