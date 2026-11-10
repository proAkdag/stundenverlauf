// Stundenverlauf · logic/kurse.mjs — Kurs-Gedächtnis: „Wie letzte Stunde“ und „Offen vom letzten Mal“.
/* Die zuletzt GESTARTETE Stunde eines Kurses wird seine „letzte Stunde“ — Grundlage für die Angebote an einem späteren Tag.
   Nur Plandaten, keine Namen. Danach folgt der Eintrag den Änderungen genau dieser Stunde (auch einem geänderten
   Kursnamen); spätere Änderungen an einer früheren Stunde desselben Tages verdrängen ihn nicht (Fremdprüfung 2026-09-30).
   Alle Funktionen arbeiten auf dem Stand S (logic/speicher.mjs) und ändern ihn an Ort und Stelle. */
import { KURSE_MAX } from './konstanten.mjs?v=3.0.1';
import { heute, kursSchluessel, neueId, pruefePlan } from './plan.mjs?v=3.0.1';

export const offeneVon = k => [...k.uebertrag, ...k.plan.phasen.filter(p => p.offen)];

export function kursMerken(S, i = S.aktiv, start = false) {
  const p = S.stunden[i];
  // heute gelaufen, oder an einem vergangenen Tag (logic/tage.mjs) an genau diesem Tag: „blieb offen“ am Morgen danach
  // erreicht so das Gedächtnis; eine heute stehende Stunde mit altem Datum (Stand ohne Tage) ändert es weiter nicht
  if (!p || (p.gelaufen !== heute() && !(S.tag < heute() && p.gelaufen === S.tag))) return;
  const schl = kursSchluessel(p.kurs, p.fach);
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

/* Angebot nur an einem anderen Tag als die letzte Stunde (S.tag = angezeigter Tag, logic/tage.mjs; ohne tag heute).
   P = Plan, der gerade in S.aktiv gezeigt wird (auch ein Entwurf). */
export function letzteStunde(S, P) {
  const k = S.kurse[kursSchluessel(P.kurs, P.fach)];
  // kein Angebot am selben Tag — und keins auf sich selbst: steht im Platz noch genau jene Stunde, ist alles schon da
  return k && k.datum !== (S.tag || heute()) && !(k.stunde === S.aktiv && P.gelaufen === k.datum) ? k : null;
}

/* „Wie letzte Stunde“: alles außer der Hausaufgabe (die eigene bleibt); die offenen Phasen jener Stunde stecken schon im
   Ablauf, Übertragenes von noch früher kommt nach vorn. Die Stunde behält ihre Kennung (pid) — die alte Stunde des Kurses
   trägt ihre eigene. */
export function planWieLetzte(k, P) {
  const neu = pruefePlan({ ...structuredClone(k.plan), pid: P.pid, kurs: P.kurs.trim() || k.name, gelaufen: '' });
  neu.abschluss.ha = P.abschluss.ha;
  neu.phasen = [...structuredClone(k.uebertrag), ...neu.phasen].slice(0, 12);
  neu.phasen.forEach(p => { p.id = neueId(); p.offen = false; });
  return neu;
}
/* „Vorne einfügen“: die offenen Phasen als neue Phasen (eigene IDs, nicht mehr offen) */
export const offenAlsNeu = k => offeneVon(k).map(p => ({ ...structuredClone(p), id: neueId(), offen: false }));

/* Bausteine am Auftragsfeld (Entwurf 3.0, Platzhalter bis zu den echten Bausteinen): Aufträge und Hausaufgabe der letzten
   Stunde desselben Kurses an einem früheren Tag, ohne den Text, der schon im Feld steht; höchstens sechs, ohne Doppelte. */
export function bausteinVorschlaege(S, P, eigener = '') {
  const k = S.kurse[kursSchluessel(P.kurs, P.fach)];
  if (!k || k.datum === (S.tag || heute())) return [];
  const texte = [...k.plan.phasen.map(x => x.auftrag), k.plan.abschluss.ha].map(t => (t || '').trim()).filter(t => t && t !== eigener.trim());
  return [...new Set(texte)].slice(0, 6);
}
