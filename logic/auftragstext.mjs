// Stundenverlauf · logic/auftragstext.mjs — Aufträge sind reiner Text; Listen stecken nur in den Zeilenanfängen.
/* Jede Zeile, die mit „• “, „- “ oder „1. “ beginnt, ist ein Listenpunkt. Hier: Listen umschalten und fortsetzen
   (als reine Textumformung mit Markierung), Stichpunkt für die Übersicht, Gliederung für die Bühne. Ohne DOM. */
export const LISTE_RE = /^(\s*)(?:([•\-–*])|(\d+)([.)]))\s+/;

export function zeilenBereich(v, a, e) {
  const start = v.lastIndexOf('\n', a - 1) + 1;
  let ende = v.indexOf('\n', e > a && v[e - 1] === '\n' ? e - 1 : e);
  return [start, ende < 0 ? v.length : ende];
}
/* art 'punkt' | 'nummer' auf die markierten Zeilen; ist es schon diese Liste, gehen die Zeichen weg.
   Ergebnis: {wert, marke} — neuer Text und Stelle der Schreibmarke */
export function listeUmschalten(v, selStart, selEnde, art) {
  const [start, ende] = zeilenBereich(v, selStart, selEnde);
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
  return { wert: v.slice(0, start) + neu + v.slice(ende), marke: start + neu.length };
}
/* Enter an Stelle a in einem Listenpunkt: nächster Punkt; Enter auf leerem Punkt beendet die Liste.
   Ergebnis {wert, marke} oder null (kein Listenpunkt — Enter bleibt, wie es ist) */
export function listeWeiterText(v, a) {
  const start = v.lastIndexOf('\n', a - 1) + 1;
  const m = v.slice(start, a).match(LISTE_RE);
  if (!m) return null;
  if (!v.slice(start + m[0].length, a).trim()) return { wert: v.slice(0, start) + v.slice(a), marke: start };
  const praefix = m[1] + (m[2] ? m[2] : (Number(m[3]) + 1) + m[4]) + ' ';
  return { wert: v.slice(0, a) + '\n' + praefix + v.slice(a), marke: a + 1 + praefix.length };
}
/* Stichpunkt für die Anfangsübersicht: erste Zeile mit Inhalt (reine Listenzeichen zählen nicht), ohne Listenzeichen;
   endet sie auf „:“ („Aufgaben:“), kommt die nächste Zeile dazu. Höchstens max Zeichen, an einer Wortgrenze gekürzt. */
export function stichpunkt(roh, max = 34) {
  const zeilen = (roh || '').split('\n').map(z => z.replace(LISTE_RE, '').trim()).filter(z => /[\p{L}\p{N}]/u.test(z) && !/^\d+[.)]$/.test(z));
  const t = (zeilen[0]?.endsWith(':') && zeilen[1] ? zeilen[0] + ' ' + zeilen[1] : zeilen[0] || '').replace(/\s*:$/, '');
  if (t.length <= max) return t;
  const schnitt = t.slice(0, max + 1).lastIndexOf(' ');
  return t.slice(0, schnitt > max * .6 ? schnitt : max).replace(/[\s,;.:–-]+$/, '') + ' …';
}
/* Bühne: Text → Blöcke {art: 'p' | 'ul' | 'ol', text | punkte[{text, nr}]} (Nummern so, wie sie getippt wurden) und Zeilenzahl */
export function gliedern(roh) {
  const bloecke = [];
  let liste = null, zeilen = 0;
  for (const z of roh.split('\n')) {
    if (!z.trim()) { liste = null; continue; }
    zeilen++;
    const m = z.match(LISTE_RE), art = m ? (m[2] ? 'ul' : 'ol') : null;
    if (!art) { liste = null; bloecke.push({ art: 'p', text: z.trim() }); continue; }
    if (!liste || liste.art !== art) bloecke.push(liste = { art, punkte: [] });
    liste.punkte.push({ text: z.slice(m[0].length).trim(), nr: m[3] || null });
  }
  return { bloecke, zeilen };
}
