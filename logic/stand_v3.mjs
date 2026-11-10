// Stundenverlauf · logic/stand_v3.mjs — den Stand der App (leseStand in app/logic/speicher.mjs) um die Felder der 3.0 ergänzen.
// Additiv wie seit 2.1.0: Der Schlüssel stundenverlauf.v2 bleibt, ein Stand der 2.3.4 lädt ohne Verlust. Jedes neue Feld
// wird geprüft; hat es den falschen Typ, wird es verworfen (Standardwert), der Rest bleibt (Konzept §9).
// Noch nicht hier, weil es auf Zero wartet: vorrat, fuer, std, abAnker, rhythmus, Prüfsumme im Plan-Link.
import { FAECHER, MUSTER_MAX } from './konstanten.mjs?v=3.0.1';
import { hat, pruefeMuster } from './plan.mjs?v=3.0.1';
import { pruefeStundenplan } from './stundenplan.mjs?v=3.0.1';
import { pruefeEigene, pruefeZaehler } from './textbausteine.mjs?v=3.0.1';
import { leseTage } from './tage.mjs?v=3.0.1';

export const STAND_V = 3;

/* s: Ergebnis von leseStand(roh).s; roh: derselbe Text (JSON) aus dem Speicher; typIds: bekannte Stundentyp-IDs.
   Gibt s zurück, ergänzt um plan (Stundenplan), bausteine { eigen, zaehler }, muster[].fach, mitHa, mitLink, v
   und den Tagen: tag, tage, ausfall je Stunde (logic/tage.mjs leseTage). */
export function erweitereStand(s, roh, typIds = new Set()) {
  let o = null;
  try { o = JSON.parse(roh || 'null'); } catch { o = null; }
  if (!o || typeof o !== 'object') o = {};
  s.plan = pruefeStundenplan(o.plan, typIds);
  const b = o.bausteine && typeof o.bausteine === 'object' && !Array.isArray(o.bausteine) ? o.bausteine : {};
  s.bausteine = { eigen: pruefeEigene(b.eigen), zaehler: pruefeZaehler(b.zaehler) };
  // Muster mit Fach (alte Muster ohne Feld gelten für alle Fächer): dieselbe Auswahl wie leseStand, dann das Feld dazu
  const roheMuster = Array.isArray(o.muster) ? o.muster.filter(m => pruefeMuster(m)).slice(0, MUSTER_MAX) : [];
  s.muster.forEach((m, i) => { const f = roheMuster[i]?.fach; m.fach = typeof f === 'string' && hat(FAECHER, f) ? f : ''; });
  // Schalter der Einrichtung (Zero 10.11.): Feld „Hausaufgabe“ und „+ Link“ je Phase, beide ab Werk aus
  s.mitHa = o.mitHa === true;
  s.mitLink = o.mitLink === true;
  s.v = STAND_V;
  return leseTage(s, o);
}
