// Stundenverlauf · js/zustand.mjs — der eine Stand der App (S), der gezeigte Plan und das Schreiben in den Speicher.
// Alle Ansichten lesen und ändern dasselbe Objekt S; geschrieben wird nur hier.
import { SCHLUESSEL, FAECHER, ANZEIGE } from '../logic/konstanten.mjs?v=3.0.1';
import { standardPlan } from '../logic/plan.mjs?v=3.0.1';
import { leseStand } from '../logic/speicher.mjs?v=3.0.1';
import { kursMerken } from '../logic/kurse.mjs?v=3.0.1';
import { erweitereStand } from '../logic/stand_v3.mjs?v=3.0.1';
import { typIds } from '../logic/stundentypen.mjs?v=3.0.1';
import { wochentag, eintragGilt, entwurfFuer } from '../logic/stundenplan.mjs?v=3.0.1';
import { DATEN } from '../logic/bausteine_daten.mjs?v=3.0.1';
import { datumVon, fuerSpeicher } from '../logic/tage.mjs?v=3.0.1';
import { $, melde } from './dom.mjs?v=3.0.1';

let roh = null, lesbar = true;
try { roh = localStorage.getItem(SCHLUESSEL); } catch { lesbar = false; }
const gelesen = leseStand(roh);
// Stand 3 (logic/stand_v3.mjs): Stundenplan S.plan, Bausteine, Fach der Muster, v — geschrieben wird er mit S wie alles andere
erweitereStand(gelesen.s, roh, typIds(DATEN));
export const S = gelesen.s;
// Stand vor 2.3: Stunden ohne pid haben beim Lesen eine Kennung bekommen — der Start schreibt sie sofort fest
export const pidNeu = gelesen.pidNeu;

/* entwurf: Eine freie Stunde zeigt einen Entwurf; belegt (und gespeichert) wird sie erst beim ersten Eintrag.
   buehneAn: die Bühne ist offen. speicherGeht: der letzte Zugriff auf localStorage klappte.
   park: der Lauf, während die Einrichtung einen anderen Tag zeigt (logic/tage.mjs wechsleTag). voll: der Speicher war voll. */
export const lage = { entwurf: null, buehneAn: false, speicherGeht: lesbar && gelesen.lesbar, park: { tag: '', lauf: null }, voll: false };
// Was nach jeder Plan-Änderung neu gemalt wird (die Tagesleiste); setzt js/einrichtung.mjs
export const haken = { nachSpeichern: () => {} };

function fachDavor() {
  for (let i = S.aktiv - 1; i >= 0; i--) if (S.stunden[i]) return S.stunden[i].fach;
  return S.stunden.find(Boolean)?.fach || 'Mathematik';
}
// Freie Stunde: Entwurf aus dem Stundenplan des angezeigten Tages (Fach, Kurs, Stundentyp), sonst der Standard im Fach davor
function entwurf() {
  const d = datumVon(S.tag), e = S.plan[wochentag(d)]?.[S.aktiv];
  return eintragGilt(e, d) ? entwurfFuer(e, DATEN, S.stunde) : standardPlan(fachDavor());
}
export function plan() { return S.stunden[S.aktiv] || (lage.entwurf ||= entwurf()); }
export const fachAnzeige = (f = plan().fach) => ANZEIGE[f] || f;

export const speicherForm = () => fuerSpeicher(S, lage.park);
let speicherTimer = 0;
export function schreibe(sofort = false) {   // nur schreiben — für Einstellungen, die für alle Stunden gelten
  clearTimeout(speicherTimer);
  const jetzt = () => {
    // gespeichert wird der Heimattag als stunden (logic/tage.mjs fuerSpeicher); scheitert es, bleibt der letzte gültige Stand
    let voll = false;
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(speicherForm())); lage.speicherGeht = true; }
    catch (e) { lage.speicherGeht = false; voll = e?.name === 'QuotaExceededError'; }
    if (voll && !lage.voll) melde('Speicher voll. Die letzte Änderung ist nicht gespeichert.');
    lage.voll = voll;
    $('e-fuss').textContent = lage.speicherGeht
      ? 'Läuft ohne Internet. Die Stunden bleiben auf diesem Gerät gespeichert.'
      : voll ? 'Speicher voll. Die letzte Änderung ist nicht gespeichert. Sichere die Pläne und frag nach, bevor du Tage löschst.'
      : 'Läuft ohne Internet. Diese Ansicht speichert nichts (privates Fenster oder eingebettete Anzeige?) – Einträge gelten nur bis zum Schließen.';
  };
  if (sofort) jetzt(); else speicherTimer = setTimeout(jetzt, 250);
}
export function speichere(sofort = false) {  // Plan der gewählten Stunde geändert → sie ist ab jetzt belegt
  if (!S.stunden[S.aktiv] && lage.entwurf) { S.stunden[S.aktiv] = lage.entwurf; lage.entwurf = null; }
  kursMerken(S);
  haken.nachSpeichern();
  schreibe(sofort);
}
addEventListener('pagehide', () => schreibe(true));

/* Farbe und Anzeige: Fachfarbe des gezeigten Plans, Hell oder Dunkel */
export function setzeFarbe() {
  const [hue, stufe] = FAECHER[plan().fach] || [250, 0];
  document.documentElement.style.setProperty('--hue', String(hue));
  document.documentElement.style.setProperty('--stufe', String(stufe));
  document.documentElement.dataset.theme = S.theme;
}
