// Stundenverlauf · logic/klassenbuch.mjs — nach der Stunde ein fertiger Text fürs Klassenbuch zum Kopieren (Konzept §7,
// übernommen aus _arbeit/konzept/klassenbuch.mjs). Die App weiß: Datum (gelaufen), Platz, Fach, Kurs, Thema, Ziel, die Phasen
// mit Form, „blieb offen“ und die Hausaufgabe. Wie die Stunde verlief, schreibt die Lehrkraft selbst dazu.
// Trenner sind Komma, Semikolon und Zeile, nie der Malpunkt. Zeilen ohne Inhalt fallen weg. An die Kladde geht nichts (Zero 10.11.).
import { FORM } from './konstanten.mjs?v=3.1.0';

const TAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const LISTE = /^(\s*)(•|[-–*]|\d+[.)])\s+/;
const ersteZeile = t => (t || '').split('\n').map(z => z.replace(LISTE, '').trim()).find(z => /[\p{L}\p{N}]/u.test(z)) || '';
const ohneSchluss = s => s.replace(/[.:]+$/, '');

/* plan: Plan der Stunde (wie im Speicher); i: Platz 0 bis 5. Zeilen als Liste; nicht gelaufene Stunde → null. */
export function klassenbuchZeilen(plan, i = 0) {
  if (!/^\d{4}-\d\d-\d\d$/.test(plan?.gelaufen || '')) return null;
  const [j, m, t] = plan.gelaufen.split('-').map(Number);
  const tag = TAG[new Date(j, m - 1, t).getDay()];
  const arbeit = plan.phasen.filter(p => p.typ !== 'pause');
  const offen = arbeit.filter(p => p.offen);
  const zeilen = [`${tag}, ${String(t).padStart(2, '0')}.${String(m).padStart(2, '0')}.${j}, ${i + 1}. Stunde, ${plan.fach}${plan.kurs.trim() ? ' ' + plan.kurs.trim() : ''}`];
  if (plan.thema.trim()) zeilen.push(`Thema: ${plan.thema.trim()}`);
  if (plan.ziel.trim()) zeilen.push(`Ziel: ${plan.ziel.trim()}`);
  if (arbeit.length) zeilen.push('Ablauf: ' + arbeit.map(p => ersteZeile(p.auftrag) ? `${FORM[p.typ].name} (${ohneSchluss(ersteZeile(p.auftrag))})` : FORM[p.typ].name).join('; '));
  if (offen.length) zeilen.push('Blieb offen: ' + offen.map(p => ohneSchluss(ersteZeile(p.auftrag) || FORM[p.typ].name)).join('; '));
  const ha = plan.abschluss.ha.split('\n').map(z => z.replace(LISTE, '').trim()).filter(Boolean).join(' ');
  if (ha) zeilen.push('Hausaufgabe: ' + ha);
  return zeilen;
}
export const klassenbuchText = (plan, i = 0) => klassenbuchZeilen(plan, i)?.join('\n') ?? null;
