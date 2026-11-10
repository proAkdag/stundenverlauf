// Stundenverlauf · js/austausch.mjs — Plan weitergeben (Link, QR) und Plan übernehmen (Link, Scanner).
/* Weitergeben (2.2): der Plan einer Stunde als Link und als QR-Code (qrcode-generator, MIT, aus der Werft-Arena). Das Handy
   scannt ihn mit der Kamera, öffnet die App und übernimmt den Plan in eine Stunde seiner Wahl. Nur Plandaten, keine Namen. */
import { STUNDEN } from '../logic/konstanten.mjs?v=3.0.0';
import { neueId } from '../logic/plan.mjs?v=3.0.0';
import { planHash, planAusLink } from '../logic/planlink.mjs?v=3.0.0';
import { laufFrisch } from '../logic/uhren.mjs?v=3.0.0';
import { planAktualisieren, importVorschlag } from '../logic/abgleich.mjs?v=3.0.0';
import { pidAnderswo } from '../logic/tage.mjs?v=3.0.0';
import { $, h } from './dom.mjs?v=3.0.0';
import { S, lage, plan, fachAnzeige, schreibe, speichere } from './zustand.mjs?v=3.0.0';
import { malEinrichten } from './einrichtung.mjs?v=3.0.0';
import { zurEinrichtung, buehneNeu } from './buehne.mjs?v=3.0.0';

export async function weitergeben() {
  // ein Entwurf bekäme nach dem Neuladen eine neue pid — wer ihn weitergibt, belegt die Stunde
  if (!S.stunden[S.aktiv]) speichere(true);
  const P = plan(), box = $('d-weiter-qr');
  let link = '', svg = '', grund = '';
  try { link = location.origin + location.pathname + await planHash(P); } catch { grund = 'dieser Browser kann den Plan nicht verpacken.'; }
  if (link) {
    if (typeof qrcode !== 'function') grund = 'der QR-Baustein ist nicht geladen, bitte „Link teilen“.';
    else try { const qr = qrcode(0, 'L'); qr.addData(link, 'Byte'); qr.make(); svg = qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true }); }
    catch { grund = 'zu lang für einen QR-Code, bitte „Link teilen“.'; }
  }
  $('d-weiter-text').textContent = `${S.aktiv + 1}. Stunde · ${fachAnzeige(P.fach)}${P.kurs.trim() ? ' · ' + P.kurs.trim() : ''}${P.thema.trim() ? ' · ' + P.thema.trim() : ''} — `
    + (svg ? 'am anderen Gerät in der App mit „Plan holen“ scannen, während der Stunde auf der Bühne mit „Update holen“.' : grund);
  if (svg) box.innerHTML = svg; else box.replaceChildren();
  box.hidden = !svg;
  box.dataset.link = link;
  $('d-weiter-teilen').textContent = 'Link teilen';
  $('d-weiter-teilen').disabled = !link;
  $('d-weiter').showModal();
}
async function linkTeilen() {
  const link = $('d-weiter-qr').dataset.link;
  if (!link) return;
  if (navigator.share) { try { await navigator.share({ title: 'Stundenverlauf', url: link }); } catch { /* abgebrochen */ } return; }
  try { await navigator.clipboard.writeText(link); $('d-weiter-teilen').textContent = 'Link kopiert'; }
  catch { $('d-weiter-teilen').textContent = 'Kopieren nicht möglich'; }
}

let eingang = null;
export async function importPruefen() {   // mit #plan=… geöffnet (Kamera-App, geteilter Link)
  if (!location.hash.startsWith('#plan=')) return;
  const hash = location.hash;
  history.replaceState(null, '', location.pathname + location.search);   // einmal übernehmen, nicht bei jedem Neuladen
  await eingangLesen(hash);
}
/* Update einer Stunde, die dieses Gerät schon hat (gleiche pid) — die Regeln stehen in logic/abgleich.mjs */
function aktualisiere(i, p) {
  const aufBuehne = lage.buehneAn && i === S.aktiv;
  planAktualisieren(S, i, p, aufBuehne);
  schreibe(true);
  if (aufBuehne) buehneNeu();
}
/* Gemeinsamer Weg für Link und Scanner. Auf der Bühne: gleiche pid wie die laufende Stunde → sofort übernehmen,
   die Bühne bleibt offen. Ein Code einer anderen Stunde aus „Update holen“ schließt die Bühne nicht (Fremdprüfung 2.3,
   Befund 2) — nur ein geöffneter Link führt, wie in 2.2, erst zur Einrichtung (nie über der laufenden Bühne). */
export async function eingangLesen(hash, vonBuehne = false) {
  let p = null;
  try { p = await planAusLink(hash); } catch { p = null; }
  if (!p) { meldung('Dieser Code enthält keinen lesbaren Plan.'); return; }
  if (lage.buehneAn && S.stunden[S.aktiv]?.pid === p.pid) { aktualisiere(S.aktiv, p); meldung('Plan aktualisiert'); return; }
  if (lage.buehneAn && vonBuehne) { meldung('Dieser Code gehört zu einer anderen Stunde – in der Einrichtung mit „Plan holen“ übernehmen.'); return; }
  if (lage.buehneAn) zurEinrichtung();
  eingang = p;
  const { gleich, laeuft, wahl } = importVorschlag(S, p);
  $('d-import-stunde').replaceChildren(...S.stunden.map((x, i) => h('option', { value: String(i) },
    `${i + 1}. Stunde · ${x ? fachAnzeige(x.fach) + (x.thema.trim() ? ' · ' + x.thema.trim() : '')
      + (i === gleich ? ' (wird aktualisiert)' : i === laeuft ? ' (läuft gerade – wird ersetzt)' : ' (wird ersetzt)') : 'frei'}`)));
  $('d-import-stunde').value = String(wahl);
  $('d-import-titel').textContent = gleich >= 0 ? 'Plan aktualisieren' : 'Plan übernehmen';
  $('d-import-text').textContent = `${fachAnzeige(p.fach)}${p.kurs.trim() ? ' · ' + p.kurs.trim() : ''}${p.thema.trim() ? ' · ' + p.thema.trim() : ''} · ${p.phasen.length} Phasen`;
  $('d-import').showModal();
}
function importUebernehmen() {
  const i = Number($('d-import-stunde').value);
  if (!eingang || !(i >= 0 && i < STUNDEN)) return;
  const p = eingang, update = S.stunden[i]?.pid === p.pid;
  if (!update && laufFrisch(S) && S.lauf.stunde === i && !confirm(`Die ${i + 1}. Stunde läuft gerade. Trotzdem ersetzen? Ihre Uhren beginnen dann von vorn.`)) return;
  eingang = null;
  $('d-import').close();
  S.aktiv = i; lage.entwurf = null;
  if (update) { aktualisiere(i, p); malEinrichten(); return; }
  // eine Kennung, eine Stunde: steht dieselbe pid schon in einem anderen Platz oder an einem anderen Tag (logic/tage.mjs),
  // bekommt die Kopie hier eine eigene; die Stunde dort bleibt, wie sie ist
  if (S.stunden.some((x, k) => x && k !== i && x.pid === p.pid) || pidAnderswo(S, p.pid)) p.pid = neueId();
  S.stunden[i] = p;
  if (S.lauf?.stunde === i) S.lauf = null;
  speichere(true); malEinrichten();
}

/* Meldung: auf der Bühne leise unten (liest die Klasse mit), in der Einrichtung als Hinweis */
let meldungTimer = 0;
export function meldung(t) {
  if (!lage.buehneAn) { alert(t); return; }
  const m = $('b-meldung');
  m.textContent = t; m.hidden = false;
  clearTimeout(meldungTimer);
  meldungTimer = setTimeout(() => { m.hidden = true; }, 3500);
}

export function initAustausch() {
  $('d-weiter-teilen').addEventListener('click', linkTeilen);
  $('d-weiter-zu').addEventListener('click', () => { $('d-weiter').close(); $('d-weiter-teilen').textContent = 'Link teilen'; });
  $('d-import-ja').addEventListener('click', importUebernehmen);
  $('d-import-nein').addEventListener('click', () => { eingang = null; $('d-import').close(); });
  addEventListener('hashchange', importPruefen);
}
