// Stundenverlauf · js/sicherung_ansicht.mjs — „Sichern“ und „Zurückholen“ am Ende der Einrichtung, neben Version und Update.
// Die Datei baut und prüft logic/sicherung.mjs; hier nur Teilen oder Herunterladen, Datei wählen, Vorschau, Rückfrage.
// Die Bühne erreicht das nicht: der Behälter liegt in der Einrichtung, die während der Stunde verborgen ist.
import { sicherungAus, pruefeSicherung, vorschau, zusammenfuehren } from '../logic/sicherung.mjs?v=3.1.0';
import { typIds } from '../logic/stundentypen.mjs?v=3.1.0';
import { DATEN } from '../logic/bausteine_daten.mjs?v=3.1.0';
import { $, h, melde } from './dom.mjs?v=3.1.0';
import { S, lage, schreibe, speicherForm } from './zustand.mjs?v=3.1.0';
import { updateHaken } from './kern/update.mjs?v=3.1.0';
import { heute } from '../logic/plan.mjs?v=3.1.0';
import { wechsleTag } from '../logic/tage.mjs?v=3.1.0';

let version = '', neuMalen = () => {};

/* Am iPad über das Teilen-Blatt („In Dateien sichern“), sonst als Download (Muster der Kladde: Teilen-Fehler → Download) */
async function sichern() {
  const { name, text } = sicherungAus(speicherForm(), new Date(), version);   // alle Tage, heute als stunden
  const datei = new File([text], name, { type: 'application/json' });
  const tippen = matchMedia('(pointer: coarse)').matches;
  if (tippen && navigator.canShare?.({ files: [datei] })) {
    try { await navigator.share({ files: [datei] }); return true; }
    catch (e) { if (e?.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(datei);
  const a = h('a', { href: url, download: name, hidden: true });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}

let gewaehlt = null;   // geprüfter Stand der gewählten Datei, bis zur Antwort im Blatt
async function dateiGewaehlt(e) {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  let text = '';
  try { text = await f.text(); } catch { text = ''; }
  const r = pruefeSicherung(text, typIds(DATEN));
  if (!r.ok) { melde(`Nicht zurückgeholt: ${r.grund}.`); return; }
  gewaehlt = r.stand;
  $('d-sicherung-text').textContent = vorschau(r.stand, r.kopf) + '.';
  $('d-sicherung').showModal();
}
function zurueckholen(art) {
  $('d-sicherung').close();
  if (!gewaehlt) return;
  const neu = zusammenfuehren(S, gewaehlt, art);
  gewaehlt = null;
  for (const k of Object.keys(S)) if (!(k in neu)) delete S[k];
  Object.assign(S, neu);
  lage.entwurf = null;
  // „Alles ersetzen“: der Lauf ist zu Ende, auch ein geparkter; die Sicherung kann von einem anderen Tag sein → heute zeigen
  if (art === 'alles') { lage.park.lauf = null; lage.park.tag = ''; wechsleTag(S, heute(), null); }
  schreibe(true); neuMalen();
  melde('Zurückgeholt.');
}

export function initSicherung(appVersion, malen) {
  version = appVersion; neuMalen = malen;
  const datei = h('input', { type: 'file', accept: '.json,application/json', hidden: true, id: 'e-sicherung-datei', onchange: dateiGewaehlt });
  $('e-sicherung').replaceChildren(
    h('button', { type: 'button', class: 'knopf', id: 'e-sichern', onclick: () => sichern() }, 'Sichern'),
    h('button', { type: 'button', class: 'knopf', id: 'e-zurueckholen', onclick: () => datei.click() }, 'Zurückholen'),
    datei);
  $('d-sicherung-alles').addEventListener('click', () => zurueckholen('alles'));
  $('d-sicherung-muster').addEventListener('click', () => zurueckholen('muster'));
  $('d-sicherung-nein').addEventListener('click', () => { gewaehlt = null; $('d-sicherung').close(); });
  // vor einem Update das Sichern anbieten
  updateHaken.vorUpdate = async () => { if (confirm('Vor dem Update sichern?')) await sichern(); };
}
