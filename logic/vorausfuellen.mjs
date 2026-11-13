// Stundenverlauf · logic/vorausfuellen.mjs — Rechnungen für die Ansichten des Vorausfüllens (ohne DOM, ohne Speicher, ohne Uhr):
// welche Chips eine Baustein-Reihe zeigt, was ein Stundentyp an Getipptem verdrängen würde, welche Muster zum Fach passen,
// welche freien Plätze der Stundenplan heute kennt und wo der Kurzlink umbrechen darf.
// Zero 10.11.: „wir brauchen also ein System, was vieles sinnvoll vorausfüllt.“
import { ordne, SICHTBAR } from './textbausteine.mjs?v=3.1.0';
import { stichpunkt } from './auftragstext.mjs?v=3.1.0';
import { wochentag, eintragGilt } from './stundenplan.mjs?v=3.1.0';

/* Aufschrift eines Chips: Lücken als „…“, erste Zeile, höchstens n Zeichen */
export const chipText = (text, n = 30) => stichpunkt(String(text || '').replace(/\{[A-Za-z0-9]+\}/g, '…'), n);

/* Eine Reihe unter einem Feld. letzte: Texte der letzten Stunde des Kurses (erste Gruppe, höchstens LETZTE_VORN davon vorn);
   bausteine: passende Bausteine (bausteineFuer); zaehler: S.bausteine.zaehler.
   Ergebnis { sichtbar: Einträge für die Chips (höchstens SICHTBAR), alle: { letzte, bausteine } für „Mehr“ }.
   Ein Eintrag ist { art: 'letzte', text } oder { art: 'baustein', b }. */
export const LETZTE_VORN = 2;
export function reiheFuer({ letzte = [], bausteine = [], zaehler = {} }) {
  const l = [...new Set(letzte.map(t => (t || '').trim()).filter(Boolean))].map(text => ({ art: 'letzte', text }));
  // eigene (ID „e-…“) vor den mitgelieferten: wer einen Satz merkt, will ihn gleich wiederfinden
  const geordnet = ordne(bausteine, zaehler), eigen = x => x.id.startsWith('e-');
  const b = [...geordnet.filter(eigen), ...geordnet.filter(x => !eigen(x))].map(x => ({ art: 'baustein', b: x }));
  const sichtbar = [...l.slice(0, LETZTE_VORN), ...b].slice(0, SICHTBAR);
  const versteckt = l.length + b.length - sichtbar.length;
  return { sichtbar, versteckt, alle: { letzte: l, bausteine: b } };
}

/* Stundentyp auf einen Plan legen: wie viele getippte Aufträge und Fertig-Aufträge gingen verloren?
   alt: der Plan vorher, neu: planAusTyp(…).plan. Erhalten bleibt ein Text, der an derselben Stelle wieder steht. */
export function verloreneTexte(alt, neu) {
  let n = 0;
  (alt?.phasen || []).forEach((p, i) => {
    const q = neu?.phasen?.[i];
    for (const k of ['auftrag', 'fertig']) if ((p[k] || '').trim() && (!q || q[k] !== p[k])) n++;
  });
  return n;
}

/* Muster, die zum Fach passen (fach '' = für alle Fächer), als Stellen in der Liste — Laden und Löschen gehen über die Stelle */
export const musterStellen = (muster, fach) => muster.map((m, i) => (!m.fach || m.fach === fach ? i : -1)).filter(i => i >= 0);

/* Stundenplan-Eintrag je Platz für die Tagesleiste: nur heute (datum gereicht), nur freie Plätze, nur gültige Einträge */
export function freiAusPlan(stunden, stundenplan, datum) {
  const tag = wochentag(datum);
  return stunden.map((p, i) => {
    const e = tag ? stundenplan?.[tag]?.[i] : null;
    return p == null && eintragGilt(e, datum) ? e : null;
  });
}

/* Kurzlink in Stücke, nach denen umbrochen werden darf (nach / . ? & = - _): Die Anzeige setzt zwischen die Stücke eine
   Umbruchstelle, so bricht der Link nie mitten in einem Wort. */
export const linkStuecke = kurz => String(kurz || '').match(/[^/.?&=_-]*[/.?&=_-]?/g).filter(Boolean);
