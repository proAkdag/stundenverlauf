// Stundenverlauf · js/eingabe.mjs — Eingabe-Bausteine der Einrichtung: Segment, Zahl mit − und +, Auftragsfeld mit Listen.
import { h } from './dom.mjs?v=3.1.0';
import { listeUmschalten, listeWeiterText } from '../logic/auftragstext.mjs?v=3.1.0';

export function segment(name, optionen, wert, beiWahl, label) {
  return h('div', { class: 'segment', role: 'radiogroup', 'aria-label': label },
    optionen.map(([v, t]) => h('label', {},
      h('input', { type: 'radio', name, value: v, checked: v === wert, onchange: () => beiWahl(v) }),
      h('span', {}, t))));
}
export function stepper(wert, { min, max, schritt, einheit, label }, beiAenderung) {
  let letzter = wert;
  const eingabe = h('input', { type: 'text', inputmode: 'numeric', value: String(wert), 'aria-label': label, autocomplete: 'off' });
  const setze = v => { v = Math.min(max, Math.max(min, v)); letzter = v; eingabe.value = String(v); beiAenderung(v); };
  const jetzt = () => { const n = parseInt(eingabe.value, 10); return Number.isFinite(n) ? n : letzter; };
  eingabe.addEventListener('change', () => setze(jetzt()));
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', 'aria-label': label + ' verringern', onclick: () => { const n = jetzt(); setze(schritt > 1 ? Math.ceil(n / schritt) * schritt - schritt : n - 1); } }, '−'),
    eingabe,
    einheit ? h('span', { class: 'einheit' }, einheit) : null,
    h('button', { type: 'button', 'aria-label': label + ' erhöhen', onclick: () => { const n = jetzt(); setze(schritt > 1 ? Math.floor(n / schritt) * schritt + schritt : n + 1); } }, '+'));
}

/* Aufträge mit Listen (logic/auftragstext.mjs): Knöpfe „• Punkte“ / „1. Nummern“ und Enter setzen die Liste fort */
const FELD_WAECHST = !!window.CSS?.supports?.('field-sizing', 'content');
function setzeText(ta, r) {
  ta.value = r.wert;
  ta.setSelectionRange(r.marke, r.marke);
  ta.dispatchEvent(new Event('input'));
}
export function listeWeiter(e) {   // Enter in einem Listenpunkt: nächster Punkt; Enter auf leerem Punkt beendet die Liste
  const ta = e.target;
  // keyCode 229: Safari meldet so das Enter, das eine Wortvorschlag-/IME-Eingabe abschließt
  if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229 || e.shiftKey || ta.selectionStart !== ta.selectionEnd) return;
  const r = listeWeiterText(ta.value, ta.selectionStart);
  if (!r) return;
  e.preventDefault();
  setzeText(ta, r);
}
/* reihe(ta): Baustein-Reihe unter dem Feld (js/bausteine.mjs) */
export function auftragFeld(wert, { placeholder, label, max, klasse = '', reihe = null }, beiEingabe) {
  const ta = h('textarea', { rows: '2', maxlength: String(max), placeholder, 'aria-label': label, autocomplete: 'off' });
  ta.value = wert;
  // wächst mit dem Text, ohne Obergrenze (3.0: auch 600 Zeichen stehen ganz da); wo field-sizing fehlt (ältere Safari),
  // per Skript — auf dem iPad gibt es keinen Zieh-Griff
  const wachse = () => { if (!FELD_WAECHST) { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; } };
  ta.addEventListener('input', () => { wachse(); beiEingabe(ta.value); });
  requestAnimationFrame(wachse);
  ta.addEventListener('keydown', listeWeiter);
  // Knopf nimmt den Fokus nicht weg — sonst ginge die Markierung im Textfeld verloren
  const knopf = (art, text, aria) => h('button', { type: 'button', class: 'knopf', 'aria-label': aria,
    onpointerdown: e => e.preventDefault(),
    onclick: () => { const r = listeUmschalten(ta.value, ta.selectionStart, ta.selectionEnd, art); ta.value = r.wert; ta.focus(); setzeText(ta, r); } }, text);
  return h('div', { class: 'auftrag-feld mit-reihe ' + klasse }, ta,
    h('div', { class: 'auftrag-werkzeug' }, knopf('punkt', '• Punkte', 'Aufzählung mit Punkten'), knopf('nummer', '1. Nummern', 'Nummerierte Liste')),
    reihe ? reihe(ta) : null);
}
