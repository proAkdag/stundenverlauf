// Stundenverlauf · js/bausteine.mjs — Textbausteine unter den Feldern der Einrichtung: Chip-Reihe, „Mehr“, Lücken-Blatt,
// eigene Bausteine merken und löschen. Die Auswahl und das Einfügen rechnen logic/textbausteine.mjs und logic/vorausfuellen.mjs.
// Zero 10.11.: „Das Eintippen aller Aufträge wird viel, wenn man es ordentlich machen will“.
import { DATEN } from '../logic/bausteine_daten.mjs?v=3.1.0';
import { bausteineFuer, lueckenVon, fuelle, einfuegen, zaehle, eigenAnlegen, eigenLoeschen, GRENZEN, EIGEN_MAX } from '../logic/textbausteine.mjs?v=3.1.0';
import { reiheFuer, chipText } from '../logic/vorausfuellen.mjs?v=3.1.0';
import { neueId } from '../logic/plan.mjs?v=3.1.0';
import { $, h, icon, melde } from './dom.mjs?v=3.1.0';
import { S, plan, schreibe } from './zustand.mjs?v=3.1.0';

// Nach Merken oder Löschen eines eigenen Bausteins neu zeichnen (setzt js/einrichtung.mjs)
export const reiheHaken = { nachAenderung: () => {} };

const halteFokus = e => e.preventDefault();   // der Chip nimmt dem Feld den Fokus nicht: die Reihe bleibt offen

/* Text ins Feld: leeres Feld → Text, sonst neue Zeile (einzeilige Felder: Leerzeichen). Über der Feldgrenze ändert sich nichts. */
function setze(feld, text, gruppe, id) {
  const r = einfuegen(feld.value, text, gruppe);
  if (!r.ok) { melde('Passt nicht mehr ins Feld.'); return; }
  feld.value = r.text;
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  if (id) { S.bausteine.zaehler = zaehle(S.bausteine.zaehler, id); schreibe(); }
}

/* Lücken-Blatt: ein Feld je Lücke, „Einfügen“ setzt den gefüllten Text ein */
function lueckeOeffnen(feld, b, gruppe) {
  const d = $('d-luecke'), namen = lueckenVon(b), def = Object.fromEntries((b.luecken || []).map(l => [l.name, l]));
  const felder = namen.map(n => h('input', { type: 'text', maxlength: String(GRENZEN.luecke), autocomplete: 'off', enterkeyhint: 'next',
    inputmode: def[n]?.tastatur === 'zahl' ? 'numeric' : null, placeholder: def[n]?.hinweis || '', 'aria-label': def[n]?.hinweis || n }));
  const nimm = () => {
    const werte = Object.fromEntries(namen.map((n, i) => [n, felder[i].value]));
    const text = fuelle(b, werte);
    if (!text) { const leer = felder.find(f => !f.value.trim()); leer?.setAttribute('aria-invalid', 'true'); leer?.focus(); return; }
    d.close();
    setze(feld, text, gruppe, b.id);
  };
  felder.forEach((f, i) => f.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    if (felder[i + 1]) felder[i + 1].focus(); else nimm();
  }));
  // Satz mit Feldern an den Stellen der Lücken: man sieht, wo der Text hinkommt
  const satz = h('p', { class: 'l-satz' }, ...b.text.split(/(\{[A-Za-z0-9]+\})/).map(t => {
    const m = t.match(/^\{([A-Za-z0-9]+)\}$/);
    return m ? felder[namen.indexOf(m[1])] : t;
  }));
  $('d-luecke-form').replaceChildren(satz);
  $('d-luecke-ja').onclick = nimm;
  $('d-luecke-nein').onclick = () => d.close();
  d.showModal();
  felder[0]?.focus();
}

function nimmEintrag(feld, e, gruppe) {
  if (e.art === 'letzte') return setze(feld, e.text, gruppe, null);
  if (lueckenVon(e.b).length) return lueckeOeffnen(feld, e.b, gruppe);
  setze(feld, e.b.text, gruppe, e.b.id);
}

const chip = (feld, e, gruppe, voll = false) => {
  const text = e.art === 'letzte' ? e.text : e.b.text;
  return h('button', { type: 'button', class: 'baustein' + (e.art === 'letzte' ? ' letzte' : ''), title: text,
    'data-id': e.art === 'baustein' ? e.b.id : null, onpointerdown: halteFokus,
    onclick: () => { if (voll) $('d-mehr').close(); nimmEintrag(feld, e, gruppe); } },
  icon(e.art === 'letzte' ? 'neu' : 'plus'), h('span', {}, chipText(text, voll ? 60 : 30)));
};

/* „Mehr“: alle Bausteine des Felds, eigene mit ×, unten „Als Baustein merken“ (nimmt den Text, der im Feld steht) */
function mehrOeffnen(feld, gruppe, r) {
  const d = $('d-mehr');
  const eigene = r.alle.bausteine.filter(e => e.b.id.startsWith('e-'));
  const andere = r.alle.bausteine.filter(e => !e.b.id.startsWith('e-'));
  const teil = (titel, eintraege) => eintraege.length ? [h('h3', {}, titel), h('div', { class: 'mehr-liste' }, eintraege)] : [];
  const loesche = b => {
    if (!confirm(`Baustein „${chipText(b.text, 40)}“ löschen?`)) return;
    S.bausteine.eigen = eigenLoeschen(S.bausteine.eigen, b.id);
    schreibe(); d.close(); reiheHaken.nachAenderung();
  };
  const merken = () => {
    const text = feld.value.trim();
    if (S.bausteine.eigen.some(b => b.gruppe === gruppe && b.text === text)) { d.close(); melde('Schon gemerkt.'); return; }
    const e = eigenAnlegen(S.bausteine.eigen, { gruppe, fach: plan().fach, text }, neueId);
    d.close();
    if (e.fehler) { melde(e.fehler === 'voll' ? `Schon ${EIGEN_MAX} eigene Bausteine.` : e.fehler === 'zu lang' ? 'Zu lang für einen Baustein.' : 'Das Feld ist leer.'); return; }
    S.bausteine.eigen = e.eigen;
    schreibe(); reiheHaken.nachAenderung(); melde('Gemerkt.');
  };
  $('d-mehr-liste').replaceChildren(
    ...teil('Letzte Stunde', r.alle.letzte.map(e => chip(feld, e, gruppe, true))),
    ...teil('Eigene', eigene.map(e => h('span', { class: 'eigen-baustein' }, chip(feld, e, gruppe, true),
      h('button', { type: 'button', class: 'mini', 'aria-label': 'Baustein löschen', onclick: () => loesche(e.b) }, icon('x'))))),
    ...teil('Bausteine', andere.map(e => chip(feld, e, gruppe, true))));
  const m = $('d-mehr-merken');
  m.disabled = !feld.value.trim();
  m.onclick = merken;
  $('d-mehr-zu').onclick = () => d.close();
  d.showModal();
}

/* Die Reihe unter einem Feld. feld: textarea oder input; gruppe: 'auftrag' | 'fertig' | 'ziel' | 'abschluss' | 'ha';
   form: Sozialform der Phase (manche Bausteine gelten nur dort); letzte: Texte der letzten Stunde des Kurses. */
export function bausteinReihe(feld, { gruppe, form = '', letzte = [] }) {
  const liste = bausteineFuer(DATEN, { fach: plan().fach, gruppe, form, eigen: S.bausteine.eigen });
  const r = reiheFuer({ letzte, bausteine: liste, zaehler: S.bausteine.zaehler });
  // „Mehr“ steht vorn: am Ende der rollenden Reihe läge es außerhalb des Bildes (Design-Kritik 10.11.)
  return h('div', { class: 'bausteine', role: 'group', 'aria-label': 'Bausteine', 'data-gruppe': gruppe },
    h('button', { type: 'button', class: 'baustein mehr', onpointerdown: halteFokus, onclick: () => mehrOeffnen(feld, gruppe, r) }, 'Mehr'),
    ...r.sichtbar.map(e => chip(feld, e, gruppe)));
}
