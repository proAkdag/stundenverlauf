// Stundenverlauf · logic/stundentypen.mjs — mitgelieferte Stundentypen je Fach (Daten: bausteine_daten.mjs) zu einem Plan machen.
// Ein Tipp setzt Ablauf, Minuten und Material (Konzept VORAUSFUELLEN.md §4: −32 % Tipps). Passt die Summe nicht zur
// Stundenlänge, wird nichts gestreckt: die Lücke kommt mit zurück und die Einrichtung zeigt sie („Luft“ / „zu viel“).
import { FAECHER } from './konstanten.mjs?v=3.0.1';
import { neuePhase, pruefeMaterial, pruefeEigenes, planSumme, hat } from './plan.mjs?v=3.0.1';

export const gleicherName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/* Mitgelieferte Stundentypen lassen sich überschreiben (Zero 10.11.: „Die bestehenden Vorlagen möchte ich gerne
   überschreiben können“): Ein eigenes Muster dieses Fachs, das wie der Stundentyp heißt, gilt an seiner Stelle.
   Ergebnis: Stelle dieses Musters in muster, −1 = keines. Muster ohne Fach oder eines anderen Fachs zählen nicht. */
export const eigenStelle = (muster, fach, name) => (muster || []).findIndex(m => m.fach === fach && gleicherName(m.name, name));

/* Stundentypen eines Fachs, in der Reihenfolge der Daten. Unbekanntes Fach: keine.
   muster: die eigenen Muster (S.muster). Ein überschriebener Typ behält ID, Namen und Platz, trägt aber Ablauf und
   Material des Musters; `eigen` ist dann die Stelle des Musters (zum Löschen: der mitgelieferte Typ kommt zurück). */
export function stundentypenFuer(daten, fach, muster = []) {
  if (!hat(FAECHER, fach) || !daten?.faecher || !hat(daten.faecher, fach)) return [];
  return (daten.faecher[fach].stundentypen || []).map(t => {
    const i = eigenStelle(muster, fach, t.name);
    return i < 0 ? t : { ...muster[i], id: t.id, name: t.name, eigen: i };
  });
}

/* Alle bekannten Typ-IDs (für die Prüfung von Stundenplan-Einträgen) */
export const typIds = daten => new Set(Object.values(daten?.faecher || {}).flatMap(f => (f.stundentypen || []).map(t => t.id)));

/* Einen Typ über die ID finden, nur im eigenen Fach */
export const typVon = (daten, fach, id, muster) => stundentypenFuer(daten, fach, muster).find(t => t.id === id) || null;

/* typ: Stundentyp aus den Daten. basis: der Plan, der übernommen wird (Fach, Kurs, Thema, Modul, Ziel und Hausaufgabe bleiben).
   stundeMin: Länge der Stunde (45, 60, 67,5, 90). Ergebnis: { plan, summe, luecke }; luecke > 0 = Luft, < 0 = zu viel.
   Aufträge gehen nicht verloren, wo die Form an derselben Stelle gleich bleibt; sonst beginnt die Phase leer. */
export function planAusTyp(typ, basis, stundeMin) {
  const alt = basis?.phasen || [];
  const phasen = (typ.phasen || []).slice(0, 12).map((x, i) => {
    const p = neuePhase(x.typ, x.min, x.groesse || 4);
    const vorher = alt[i];
    // gleiche Form an derselben Stelle: Inhalt der Phase bleibt (Auftrag, Fertig und, wo die App sie hat, Link-Felder)
    if (vorher && vorher.typ === x.typ) for (const k of ['auftrag', 'fertig', 'link', 'linkName']) if (k in vorher) p[k] = vorher[k];
    return p;
  });
  const plan = {
    ...basis,
    einstieg: typ.einstieg ?? basis.einstieg,
    phasen,
    abschluss: { ...basis.abschluss, min: typ.abschlussMin ?? basis.abschluss.min },
    material: pruefeMaterial(typ.material, basis.material),
    eigenes: pruefeEigenes(typ.eigenes ?? basis.eigenes),
  };
  const summe = planSumme(plan);
  return { plan, summe, luecke: stundeMin - summe };
}
