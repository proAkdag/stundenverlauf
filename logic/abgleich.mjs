// Stundenverlauf · logic/abgleich.mjs — ein Plan vom anderen Gerät (gleiche pid) trifft auf eine Stunde dieses Geräts.
/* Die pid bleibt einem Platz über Tage treu — darum zwei Fälle (Fremdprüfung 2.3, Befund 1: sonst schrieb der Plan für
   morgen das Kurs-Gedächtnis der Stunde von heute um):
   · Die Stunde läuft gerade (auf der Bühne, oder ihr Lauf ist frisch und heute gestartet): Inhalt vom Handy, Lauf von hier.
     Uhren hängen an den Phasen-IDs und laufen weiter; eine geänderte Dauer verschiebt das Ende (kürzer als schon gelaufen:
     Ende jetzt, wie „− 1“). „blieb offen“ und „gelaufen“ bleiben die dieses Geräts.
   · Sonst ist es ein neuer Plan für diesen Platz, wie eine Übernahme: nicht gelaufen, nichts offen, kein alter Lauf. */
import { heute } from './plan.mjs?v=3.0.0';
import { fensterIds, laufFrisch, uhrFuer, uhrenAnpassen } from './uhren.mjs?v=3.0.0';
import { kursMerken } from './kurse.mjs?v=3.0.0';

/* aufBuehne = die Bühne zeigt gerade die Stunde i */
export const laeuftGerade = (S, i, aufBuehne) => aufBuehne || (laufFrisch(S) && S.lauf.stunde === i && S.stunden[i]?.gelaufen === heute());

export function planAktualisieren(S, i, neu, aufBuehne) {
  const alt = S.stunden[i];
  if (!laeuftGerade(S, i, aufBuehne)) {
    neu.phasen.forEach(p => { p.offen = false; });
    neu.gelaufen = '';
    S.stunden[i] = neu;
    if (S.lauf?.stunde === i) S.lauf = null;
    return;
  }
  const offen = new Set(alt.phasen.filter(p => p.offen).map(p => p.id));
  // gleiche Stunde, aber neue IDs (am Handy Muster geladen, Ablauf zurückgesetzt …): eine Uhr, deren Phase fehlt, geht auf
  // die neue Phase an derselben Stelle über, wenn sie dieselbe Form hat (Befund 5)
  const altIds = new Set(alt.phasen.map(p => p.id)), neuIds = new Set(neu.phasen.map(p => p.id)), umbenannt = new Map();
  neu.phasen.forEach((p, k) => { const a = alt.phasen[k]; if (a && !neuIds.has(a.id) && !altIds.has(p.id) && a.typ === p.typ) umbenannt.set(a.id, p.id); });
  for (const [a, n] of umbenannt) {
    if (S.lauf.uhren[a] && !S.lauf.uhren[n]) { S.lauf.uhren[n] = S.lauf.uhren[a]; delete S.lauf.uhren[a]; }
    if (offen.has(a)) offen.add(n);
  }
  neu.phasen.forEach(p => { p.offen = offen.has(p.id); });
  neu.gelaufen = alt.gelaufen;
  S.stunden[i] = neu;
  // dieselbe Stelle im Ablauf, auch wenn davor Phasen dazukamen oder wegfielen; fiel sie selbst weg, die nächste alte
  // Stelle, die es noch gibt (Befund 4: sonst sprang die Bühne beim Löschen zweier Phasen auf den Abschluss)
  const altF = fensterIds(alt).map(id => umbenannt.get(id) ?? id), neuF = fensterIds(neu);
  const warId = altF[S.lauf.index], warUhr = S.lauf.uhren[warId];
  let j = -1;
  for (let k = S.lauf.index; k < altF.length && j < 0; k++) j = neuF.indexOf(altF[k]);
  S.lauf.index = j >= 0 ? j : neuF.length - 1;
  uhrenAnpassen(S, neu, S.lauf.index);
  // lief die aktuelle Phase und fiel weg: mit Selbstlauf beginnt die nachgerückte jetzt, sonst stünde die Stunde still
  const nach = neu.phasen.find(p => p.id === neuF[S.lauf.index]);
  if (!neuIds.has(warId) && warUhr?.ende != null && !warUhr.weiter && Date.now() < warUhr.ende && S.selbstlauf && nach && !S.lauf.uhren[nach.id]?.gestartet) {
    const nu = uhrFuer(S.lauf, nach.id, nach.min);
    nu.gestartet = true; nu.gemeldet = false; nu.ende = Date.now() + nu.rest;
  }
  kursMerken(S, i);
}

/* Vorschlag für „In welche Stunde?“: dieselbe Stunde, sonst eine freie, sonst eine, die gerade NICHT läuft —
   nie still die laufende ersetzen. Ergebnis: {gleich, laeuft, wahl} als Platznummern (-1 = keine). */
export function importVorschlag(S, p) {
  const laeuft = laufFrisch(S) ? S.lauf.stunde : -1;
  const gleich = S.stunden.findIndex(x => x && x.pid === p.pid), frei = S.stunden.findIndex(x => !x);
  const sonst = S.aktiv !== laeuft ? S.aktiv : S.stunden.findIndex((x, i) => i !== laeuft);
  return { gleich, laeuft, wahl: gleich >= 0 ? gleich : frei >= 0 ? frei : sonst };
}
