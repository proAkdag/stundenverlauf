// Stundenverlauf · logic/speicher.mjs — den gespeicherten Stand lesen und prüfen. Ohne DOM: den Text aus dem Gerätespeicher
// reicht js/zustand.mjs herein, geschrieben wird JSON.stringify des Stands.
/* Sechs Stunden des Tages, jede mit eigenem Plan (Zero 2026-09-30). Gerätespeicher des Browsers; ohne Speicher läuft die Seite trotzdem.
   Format (Schlüssel stundenverlauf.v2, seit 2.1.0 um Felder erweitert, alte Stände laden unverändert):
     stunden[6]  Plan | null — Plan: pid, fach, kurs, thema, modul, ziel, material[], eigenes[], einstieg,
                 phasen[{id, typ, min, groesse, auftrag, fertig, offen}], abschluss{min, text, ha}, gelaufen ('JJJJ-MM-TT' | '')
                 pid (2.3) = Kennung der Stunde über Geräte hinweg: ein Plan, der mit derselben pid zurückkommt, aktualisiert
                 genau diese Stunde, auch während sie läuft (Uhren hängen an den Phasen-IDs, die mitreisen)
     muster[]    {name, einstieg, phasen[{typ, min, groesse}], abschlussMin, material[], eigenes[]} — nur Ablauf und Material (Zero)
     kurse{}     Schlüssel = „Fach|Kursname klein“ → {name, datum, stunde, plan, uebertrag[Phase], offenErledigt} — zuletzt
                 gestartete Stunde je Kurs und Fach (2.3.2: „7b“ in Mathe und Physik sind zwei Kurse; ein Eintrag mit dem
                 alten Schlüssel nur aus dem Kursnamen zieht beim Laden unter das Fach seines Plans); ein Objekt ohne
                 Prototyp, damit Kursnamen wie „constructor“ nichts Geerbtes treffen
     lauf        {stunde, index, uhren{Phasen-ID → Uhr}, stand} — die laufende Stunde; älter als LAUF_GUELTIG_MS gilt sie nicht mehr
     selbstlauf  Phasen wechseln nach Ablauf der Zeit von selbst (Schalter, aus)
     kamera      'environment' | 'user' — zuletzt gewählte Kamera des Scanners (2.3)
     phasen[].link (3.0) Material-Link je Phase, nur https://, sonst '' (pruefePlan)
   Ergänzt von logic/stand_v3.mjs erweitereStand (3.0, gleicher Schlüssel, gelesen direkt nach leseStand in js/zustand.mjs):
     plan        Stundenplan je Wochentag: {'1'…'5': [6 × {fach, kurs, typ} | null]} (logic/stundenplan.mjs) — nicht
                 verwechseln mit plan() in js/zustand.mjs, dem Plan der gewählten Stunde
     bausteine   {eigen[], zaehler{}} — eigene Textbausteine und Nutzungszähler (logic/textbausteine.mjs)
     muster[].fach  Fach eines Musters, '' = alle Fächer
     mitHa, mitLink  Schalter, ab Werk aus: die Einrichtung zeigt das Feld „Hausaufgabe“ und je Phase „+ Link“ (QR-Code auf
                 der Bühne). Ein Feld mit Inhalt steht auch bei „aus“ da, sonst wäre der Inhalt nicht mehr zu ändern.
     v           3 — Stand-Fassung; die 2.3.4 kennt plan, bausteine, fach und v nicht und lässt sie beim Schreiben fallen
   Jedes Feld läuft beim Laden durch seine Prüfung — ein Feld, das dort fehlt, geht beim Neuladen verloren. */
import { STUNDEN, LAUF_GUELTIG_MS, MUSTER_MAX } from './konstanten.mjs?v=3.0.1';
import { zahl, gueltigeId, kursName, kursSchluessel, pruefePlan, pruefeMuster, pruefeKurs } from './plan.mjs?v=3.0.1';

export function grundStand() {
  return {
    lehrkraft: 'Akdağ', theme: 'hell', signal: true, selbstlauf: false, stunde: 67.5, aktiv: 0, stunden: Array(STUNDEN).fill(null), lauf: null,
    muster: [], kurse: Object.create(null), kamera: 'environment',
  };
}

/* roh = Text aus dem Speicher (oder null). Ergebnis: der geprüfte Stand, ob er lesbar war, und ob Stunden ohne pid
   (Stand vor 2.3) eine neue Kennung bekamen — dann muss der Stand sofort geschrieben werden, sonst gilt nach dem
   Neuladen eine andere. */
export function leseStand(roh) {
  let o = null, lesbar = true, pidNeu = false;
  try { o = JSON.parse(roh || 'null'); } catch { lesbar = false; }
  const s = grundStand();
  if (!o || typeof o !== 'object') return { s, lesbar, pidNeu };
  if (o.kamera === 'user') s.kamera = 'user';
  if (typeof o.lehrkraft === 'string') s.lehrkraft = o.lehrkraft.slice(0, 40);
  if (o.theme === 'dunkel') s.theme = 'dunkel';
  s.signal = o.signal !== false;
  s.selbstlauf = o.selbstlauf === true;
  if ([45, 60, 67.5, 90].includes(o.stunde)) s.stunde = o.stunde;
  s.aktiv = Math.round(zahl(o.aktiv, 0, STUNDEN - 1, 0));
  if (Array.isArray(o.stunden)) o.stunden.slice(0, STUNDEN).forEach((p, i) => {
    if (!p) return;
    s.stunden[i] = pruefePlan(p);
    if (!gueltigeId(p.pid)) pidNeu = true;
  });
  if (Array.isArray(o.muster)) s.muster = o.muster.map(pruefeMuster).filter(Boolean).slice(0, MUSTER_MAX);
  if (o.kurse && typeof o.kurse === 'object')
    for (const [schl, k] of Object.entries(o.kurse)) {
      const g = pruefeKurs(k), neu = g && kursSchluessel(g.name, g.plan.fach);
      // neuer Schlüssel oder alter (nur Kursname, vor 2.3.2); treffen zwei auf dasselbe Fach, gilt die spätere Stunde
      if (g && (schl === neu || schl === kursName(g.name)) && !(s.kurse[neu]?.datum > g.datum)) s.kurse[neu] = g;
    }
  s.lauf = pruefeLauf(o.lauf, s.stunden);
  return { s, lesbar, pidNeu };
}

function pruefeLauf(l, stunden) {
  if (!(l && Number.isInteger(l.stunde) && stunden[l.stunde] && Number.isFinite(l.stand) && Date.now() - l.stand < LAUF_GUELTIG_MS && l.uhren && typeof l.uhren === 'object')) return null;
  const uhren = Object.create(null);   // Schlüssel sind Phasen-IDs — ohne Prototyp trifft keine ID etwas Geerbtes
  for (const [id, u] of Object.entries(l.uhren)) {
    if (!u || !Number.isFinite(u.gesamt) || !Number.isFinite(u.rest)) continue;
    const ende = Number.isFinite(u.ende) ? u.ende : null;
    // schon abgelaufen → kein Signal beim Öffnen; läuft noch → Signal am Ende wie sonst
    // weiter = der Selbstlauf hat von dieser Uhr aus schon weitergeschaltet
    uhren[id] = { gesamt: u.gesamt, rest: u.rest, ende, plan: u.plan, gestartet: !!u.gestartet, gemeldet: ende != null ? Date.now() >= ende : !!u.gemeldet, weiter: !!u.weiter };
  }
  return { stunde: l.stunde, index: Math.round(zahl(l.index, 0, 40, 0)), uhren, stand: l.stand };
}
