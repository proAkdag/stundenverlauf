// Stundenverlauf · js/stundenplan_ansicht.mjs — Stundenplan je Wochentag pflegen und „Tag anlegen“ in der Tagesleiste.
// Zero 10.11.: „die Stundenplan-Idee ist nicht schlecht“. Angelegt wird nur auf Tipp, belegte Stunden bleiben, wie sie sind
// (logic/stundenplan.mjs tagAnlegen). Ohne A/B-Wochen und nie von selbst (Zero 10.11.).
import { FACH_LISTE, STUNDEN } from '../logic/konstanten.mjs?v=3.0.1';
import { TAGE, wochentag, setzeEintrag, loescheEintrag, tagAnlegen } from '../logic/stundenplan.mjs?v=3.0.1';
import { stundentypenFuer, typIds } from '../logic/stundentypen.mjs?v=3.0.1';
import { DATEN } from '../logic/bausteine_daten.mjs?v=3.0.1';
import { $, h, icon, melde } from './dom.mjs?v=3.0.1';
import { S, lage, schreibe } from './zustand.mjs?v=3.0.1';
import { segment } from './eingabe.mjs?v=3.0.1';
import { datumVon } from '../logic/tage.mjs?v=3.0.1';

const TAG_NAME = { 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr' };
let neuMalen = () => {}, tag = '1';

// Wochentag des angezeigten Tags (logic/tage.mjs): wer Mittwoch voraus füllt, bekommt den Stundenplan vom Mittwoch
const anlegen = () => tagAnlegen(S.stunden, S.plan, datumVon(S.tag), DATEN, S.stunde, S.muster);

/* Unter der Tagesleiste: „Tag anlegen“, wenn der Stundenplan heute freie Plätze füllen kann, und der Weg zur Pflege */
export function malTagWerkzeug() {
  const kann = anlegen().belegt.length > 0;
  $('e-tag-werkzeug').replaceChildren(
    kann ? h('button', { type: 'button', class: 'knopf tag-anlegen', onclick: tagFuellen }, icon('plus'), 'Tag anlegen') : '',
    h('button', { type: 'button', class: 'leise-knopf', id: 'e-stundenplan', onclick: oeffnen }, 'Stundenplan'));
}
function tagFuellen() {
  const r = anlegen();
  if (!r.belegt.length) return;
  S.stunden = r.stunden; lage.entwurf = null;
  schreibe(true); neuMalen();
  melde(r.belegt.length === 1 ? '1 Stunde angelegt.' : `${r.belegt.length} Stunden angelegt.`);
}

/* Pflege: fünf Tage, sechs Plätze, je Platz Fach, Kurs, Stundentyp; „frei“ löscht den Eintrag */
function setze(platz, eintrag) {
  S.plan = eintrag ? setzeEintrag(S.plan, tag, platz, eintrag, typIds(DATEN)) : loescheEintrag(S.plan, tag, platz);
  schreibe();
}
function zeile(i) {
  const e = S.plan[tag][i];
  const fach = h('select', { 'aria-label': `Fach der ${i + 1}. Stunde`, onchange: ev => {
    const f = ev.target.value;
    setze(i, f ? { fach: f, kurs: e?.kurs || '', typ: '' } : null);
    malZeilen();
    // die Zeile ist neu gezeichnet: Fokus zurück auf ihr Fach (mit Tastatur sonst verloren, Befund Durchspiel 10.11.)
    $('d-plan-liste').children[i]?.querySelector('select')?.focus();
  } }, h('option', { value: '' }, 'frei'), ...FACH_LISTE.map(f => h('option', { value: f, selected: e?.fach === f }, f)));
  if (!e) return h('li', { class: 'sp-zeile frei' }, h('span', { class: 'sp-nr' }, `${i + 1}.`), fach);
  const kurs = h('input', { type: 'text', value: e.kurs, maxlength: '20', autocomplete: 'off', placeholder: 'Kurs', 'aria-label': `Kurs der ${i + 1}. Stunde`,
    oninput: ev => setze(i, { ...S.plan[tag][i], kurs: ev.target.value }) });
  const typen = stundentypenFuer(DATEN, e.fach);
  const typ = h('select', { class: 'sp-typ', 'aria-label': `Stundentyp der ${i + 1}. Stunde`, onchange: ev => setze(i, { ...S.plan[tag][i], typ: ev.target.value }) },
    h('option', { value: '' }, 'ohne Stundentyp'), ...typen.map(t => h('option', { value: t.id, selected: e.typ === t.id }, t.name)));
  return h('li', { class: 'sp-zeile' }, h('span', { class: 'sp-nr' }, `${i + 1}.`), fach, kurs, typ);
}
function malZeilen() {
  $('d-plan-tage').replaceChildren(segment('sp-tag', TAGE.map(t => [t, TAG_NAME[t]]), tag, v => { tag = v; malZeilen(); }, 'Wochentag'));
  $('d-plan-liste').replaceChildren(...Array.from({ length: STUNDEN }, (_, i) => zeile(i)));
}
function oeffnen() {
  tag = wochentag(datumVon(S.tag)) || '1';
  malZeilen();
  $('d-plan').showModal();
}

export function initStundenplan(malen) {
  neuMalen = malen;
  $('d-plan-zu').addEventListener('click', () => $('d-plan').close());
  // eine freie gewählte Stunde zeigt danach den Entwurf aus dem geänderten Stundenplan
  $('d-plan').addEventListener('close', () => { if (!S.stunden[S.aktiv]) lage.entwurf = null; neuMalen(); });
}
