// Stundenverlauf · js/tage_ansicht.mjs — Tageswahl im Kopf der Einrichtung, vergangene Tage ansehen, Ausfall, Hinweis auf
// ungestartete Stunden und „nach der Stunde“ (Klassenbuch, am vergangenen Tag auch „blieb offen“). Rechnen: logic/tage.mjs.
// Zero 10.11.: „Und gibt es eine Möglichkeit, zwischen den Tagen zu wechseln? … Aktuelles Datum sollte auch am besten lesbar
// angezeigt werden.“ Wortlaut „Fällt aus“ und „Ausfall zurücknehmen“ wie in der Kladde, damit sich beide Apps gleich anfühlen.
import { heute, hatGetipptes } from '../logic/plan.mjs?v=3.0.0';
import { laufFrisch } from '../logic/uhren.mjs?v=3.0.0';
import { formName } from '../logic/konstanten.mjs?v=3.0.0';
import { stichpunkt } from '../logic/auftragstext.mjs?v=3.0.0';
import { klassenbuchText } from '../logic/klassenbuch.mjs?v=3.0.0';
import { datumVon, schultagAb, wechsleTag, heimat, vergangen, istHeute, ungestartete, aufHeuteHolen, setzeAusfall,
  ausfallAngebot, ausfallUebernehmen } from '../logic/tage.mjs?v=3.0.0';
import { $, h, icon, melde } from './dom.mjs?v=3.0.0';
import { S, lage, plan, schreibe, speichere } from './zustand.mjs?v=3.0.0';

let malen = () => {};
const DATUM_LANG = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const DATUM_KURZ = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
export const tagKurz = iso => DATUM_KURZ.format(datumVon(iso));
const laufIrgendwo = () => laufFrisch(S) || (lage.park.lauf && laufFrisch({ lauf: lage.park.lauf }));

/* Start nur am heutigen Tag und nur, wenn die Stunde nicht ausfällt (der Lauf gehört zu heute) */
export const startErlaubt = () => istHeute(S) && !plan().ausfall;

export function wechsle(ziel) {
  if (lage.buehneAn || !wechsleTag(S, ziel, lage.park)) return;
  lage.entwurf = null;
  schreibe(); malen();
}

/* Kopf: zurück · Datum (Tipp öffnet die Datumswahl des Geräts) · vor · „Heute“ an einem anderen Tag */
function malTagwahl() {
  const art = istHeute(S) ? 'heute' : vergangen(S) ? 'vergangen' : 'kommend';
  $('einrichten').dataset.tag = art;
  const wahl = h('input', { type: 'date', id: 'e-tag-wahl', class: 'tw-wahl', value: S.tag, 'aria-label': 'Tag wählen',
    onchange: e => { if (e.target.value) wechsle(e.target.value); } });
  // Safari öffnet die Wahl beim Tipp aufs Feld; wo es das nicht tut, hilft showPicker
  wahl.addEventListener('click', () => { try { wahl.showPicker?.(); } catch { /* ohne Nutzergeste oder alt */ } });
  // Pfeile und Datum bleiben eine Gruppe: am Handy bricht eher das Datum um als der Pfeil weg (Durchspiel 10.11., G7)
  $('e-tagwahl').replaceChildren(h('span', { class: 'tw-zeile' },
    h('button', { type: 'button', class: 'tw-pfeil', id: 'e-tag-zurueck', 'aria-label': 'Voriger Schultag', onclick: () => wechsle(schultagAb(S.tag, -1)) }, icon('links')),
    h('span', { class: 'tw-datum' }, h('span', { id: 'e-datum', class: 'e-datum' }, DATUM_LANG.format(datumVon(S.tag))), wahl),
    h('button', { type: 'button', class: 'tw-pfeil', id: 'e-tag-vor', 'aria-label': 'Nächster Schultag', onclick: () => wechsle(schultagAb(S.tag, 1)) }, icon('rechts'))),
    art === 'heute' ? '' : h('button', { type: 'button', class: 'knopf tw-heute', id: 'e-tag-heute', onclick: () => wechsle(heute()) }, 'Heute'));
}

/* Vergangene Tage sind zum Ansehen: alles, was den Plan ändert, ist träge (inert). Offen bleiben Tageswahl, Tagesleiste,
   „nach der Stunde“ (Klassenbuch, „blieb offen“) und „Fällt aus“ in der Startreihe. */
const GESPERRT = ['#e-tag-werkzeug', '.e-raster > div:first-child', '#e-typen', '#e-muster', '#e-einstieg', '#e-phasen', '#e-plus',
  '#e-abschluss', '.abschluss-felder', '.budget', '#e-reset'];
function sperre() {
  const zu = vergangen(S);
  for (const sel of GESPERRT) { const e = document.querySelector(sel); if (e) e.inert = zu; }
}

/* Nichts verschwindet still: ungestartete Stunden vom letzten Schultag oder dem Wochenende danach, ein Tipp holt sie auf freie Plätze von heute */
function malHinweis() {
  const u = ungestartete(S), n = u.plaetze.length;
  if (!n) { $('e-tag-hinweis').replaceChildren(); return; }
  $('e-tag-hinweis').replaceChildren(h('div', { class: 'tag-hinweis' },
    h('span', {}, `${n === 1 ? '1 Stunde' : n + ' Stunden'} vom ${tagKurz(u.tag)} nicht gestartet`),
    u.passend.length
      ? h('button', { type: 'button', class: 'knopf', id: 'e-holen-heute', onclick: holen }, 'Auf heute holen')
      : h('button', { type: 'button', class: 'knopf', id: 'e-holen-ansehen', onclick: () => { S.aktiv = u.plaetze[0]; wechsle(u.tag); } }, 'Ansehen')));
}
function holen() {
  const geholt = aufHeuteHolen(S);
  if (!geholt.length) return;
  lage.entwurf = null;
  schreibe(true); malen();
  melde(geholt.length === 1 ? '1 Stunde geholt.' : `${geholt.length} Stunden geholt.`);
}

/* Angebot an der nächsten Stunde desselben Fachs und Kurses: die ausgefallene übernehmen (Rückfrage bei Getipptem) */
export function malAngebot() {
  const a = vergangen(S) ? null : ausfallAngebot(S, plan());
  $('e-ausfall-angebot').replaceChildren(a ? h('button', { type: 'button', class: 'knopf ausfall-angebot', id: 'e-ausfall-holen', onclick: () => uebernehmen(a) },
    `Ausgefallene Stunde vom ${tagKurz(a.tag)} übernehmen`) : '');
}
function uebernehmen(a) {
  const P = plan();
  if (S.stunden[S.aktiv] && hatGetipptes(P) && !confirm(`${S.aktiv + 1}. Stunde mit der ausgefallenen Stunde vom ${tagKurz(a.tag)} überschreiben?`)) return;
  S.stunden[S.aktiv] = ausfallUebernehmen(a, P); lage.entwurf = null;
  speichere(true); malen();
}

/* „Fällt aus“ / „Ausfall zurücknehmen“ in der Startreihe — nur für eine Stunde, die nicht lief */
export function ausfallKnopf() {
  const P = plan();
  if (P.gelaufen || (!S.stunden[S.aktiv] && !hatGetipptes(P) && !P.kurs.trim())) return '';
  const an = P.ausfall === 'offen' || P.ausfall === 'nachgeholt';
  return h('button', { type: 'button', class: 'start zweit ausfall-knopf', id: 'e-ausfall', 'aria-pressed': String(an), onclick: () => {
    setzeAusfall(P, !an);
    speichere(true); malen();
    melde(`${S.aktiv + 1}. Stunde am ${tagKurz(S.tag)}: ${an ? 'Ausfall zurückgenommen' : 'fällt aus'}`);
    $('e-ausfall')?.focus();
  } }, an ? 'Ausfall zurücknehmen' : 'Fällt aus');
}

/* Nach der Stunde (am angezeigten Tag gelaufen): Klassenbuch kopieren, am iPad übers Teilen-Blatt; am vergangenen Tag dazu
   „blieb offen“ je Arbeitsphase (der Ablauf ist dort gesperrt). Der Text entsteht erst beim Tippen: „blieb offen“ ändert ihn. */
const klassenbuchJetzt = () => klassenbuchText(plan(), S.aktiv);
function malNachher() {
  const P = plan(), da = P.gelaufen === S.tag && klassenbuchText(P, S.aktiv) != null;
  $('e-nachher').hidden = !da;
  if (!da) { $('e-nachher').replaceChildren(); return; }
  const kopieren = async () => {
    const t = klassenbuchJetzt();
    let ok = false;
    try { await navigator.clipboard.writeText(t); ok = true; } catch {
      const ta = h('textarea', { readonly: true, class: 'nur-kopie' }); ta.value = t;
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    melde(ok ? 'Fürs Klassenbuch kopiert.' : 'Kopieren ging nicht.');
  };
  const offen = vergangen(S) ? P.phasen.filter(p => p.typ !== 'pause').map(p => h('button', { type: 'button', class: 'offen-knopf', 'aria-pressed': String(p.offen),
    onclick: () => { p.offen = !p.offen; speichere(); malNachher(); } }, h('span', { class: 'kaestchen', 'aria-hidden': 'true' }, p.offen ? icon('fertig') : null),
    `blieb offen: ${formName(p)}${stichpunkt(p.auftrag) ? ' – ' + stichpunkt(p.auftrag, 30) : ''}`)) : [];
  $('e-nachher').replaceChildren(
    h('button', { type: 'button', class: 'knopf', id: 'e-klassenbuch', onclick: kopieren }, icon('buch'), 'Klassenbuch'),
    navigator.share ? h('button', { type: 'button', class: 'knopf', id: 'e-klassenbuch-teilen', onclick: () => navigator.share({ text: klassenbuchJetzt() }).catch(() => {}) }, 'Teilen') : '',
    offen.length ? h('div', { class: 'nachher-offen' }, ...offen) : '');
}

export function malTage() { malTagwahl(); sperre(); malHinweis(); malAngebot(); malNachher(); }

/* Beim Öffnen: heute, außer ein frischer Lauf gehört zu einem anderen Tag (nach Mitternacht). Beim Zurückkehren in die App nur,
   wenn seitdem ein neuer Tag begann und kein Lauf frisch ist — wer gerade Mittwoch füllt und kurz die App wechselt, bleibt dort. */
let gesehen = heute();
export function initTage(neuMalen) {
  malen = neuMalen;
  const ziel = heimat(S, lage.park);
  if (S.tag !== ziel) wechsleTag(S, ziel, lage.park);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const jetzt = heute(), neu = jetzt !== gesehen;
    gesehen = jetzt;
    if (neu && !laufIrgendwo() && !lage.buehneAn && S.tag !== jetzt) wechsle(jetzt);
    else malTagwahl();
  });
}
