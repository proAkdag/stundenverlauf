// Stundenverlauf · logic/plan.mjs — ein Plan, ein Muster, ein Kurs-Eintrag: anlegen und prüfen.
// Jedes Feld, das von außen kommt (Speicher, Link, QR), läuft durch seine Prüfung. Ein Feld, das hier fehlt, geht verloren.
import { FAECHER, FORM, MATERIAL, STUNDEN, FENSTER_FEST } from './konstanten.mjs?v=3.0.0';

export const neueId =() => Math.random().toString(36).slice(2, 10);
export const zahl = (v, min, max, std) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : std; };
export const text = (v, max = 200) => typeof v === 'string' ? v.slice(0, max) : '';
export const heute = () => { const d = new Date(Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const kursName = k => (k || '').trim().toLowerCase();
// Fach + Kurs (2.3.2): ein Fachname enthält kein „|“, darum bleibt der Schlüssel eindeutig; leerer Kurs → kein Schlüssel
export const kursSchluessel = (kurs, fach) => { const k = kursName(kurs); return k ? fach + '|' + k : ''; };
// nur eigene Schlüssel: „constructor“ oder „toString“ aus einem fremden Link sind kein Fach und keine Sozialform (Fremdprüfung 2.2)
export const hat = (o, k) => typeof k === 'string' && Object.hasOwn(o, k);
export const gueltigeId = s => typeof s === 'string' && /^[a-z0-9]{1,20}$/.test(s) && !FENSTER_FEST.has(s);

// Material-Link je Phase (3.0, QR auf der Bühne): nur https://, ohne Leerraum, höchstens 300 Zeichen — sonst leer
export const pruefeLink = v => typeof v === 'string' && v.length <= 300 && /^https:\/\/\S+$/.test(v) ? v : '';
export function neuePhase(typ, min, groesse = 4) { return { id: neueId(), typ, min, groesse, auftrag: '', fertig: '', offen: false, link: '' }; }

/* Phase an Stelle pos einsetzen (0 = vor der ersten, Länge = nach der letzten); höchstens 12 Phasen. true = eingesetzt */
export const PHASEN_MAX = 12;
export function phaseEinsetzen(P, pos, phase) {
  if (P.phasen.length >= PHASEN_MAX || !Number.isInteger(pos) || pos < 0 || pos > P.phasen.length) return false;
  P.phasen.splice(pos, 0, phase);
  return true;
}
/* Wohin „+“ auf der Bühne einfügt: hinter die gezeigte Phase; bei Eröffnung und Thema vorn, beim Abschluss ans Ende */
export const einfuegeStelle = (P, f) => f.art === 'phase' ? P.phasen.findIndex(p => p.id === f.id) + 1 : f.art === 'abschluss' ? P.phasen.length : 0;
export function standardPlan(fach = 'Mathematik') {
  return {
    pid: neueId(),
    fach, kurs: '', thema: '', modul: '', ziel: '',
    material: ['ipad', 'buch', 'mappe', 'schreibzeug'], eigenes: [],
    einstieg: 5,
    phasen: [neuePhase('einzel', 20), neuePhase('pause', 5), neuePhase('partner', 20)],
    abschluss: { min: 10, text: '', ha: '' },
    gelaufen: '',
  };
}
export const pruefeMaterial = (m, std) => Array.isArray(m) ? MATERIAL.map(x => x[0]).filter(x => m.includes(x)) : std;
export const pruefeEigenes = e => Array.isArray(e) ? e.filter(x => typeof x === 'string' && x.trim()).map(x => x.slice(0, 40)).slice(0, 8) : [];
export function pruefePlan(p) {
  const d = standardPlan();
  if (!p || typeof p !== 'object') return d;
  const vergeben = new Set();   // zwei Phasen mit derselben ID teilten sich eine Uhr
  const eigeneId = id => { const neu = gueltigeId(id) && !vergeben.has(id) ? id : neueId(); vergeben.add(neu); return neu; };
  return {
    pid: gueltigeId(p.pid) ? p.pid : d.pid,
    fach: hat(FAECHER, p.fach) ? p.fach : d.fach,
    kurs: text(p.kurs, 20),
    thema: text(p.thema, 120), modul: text(p.modul, 120), ziel: text(p.ziel, 160),
    material: pruefeMaterial(p.material, d.material),
    eigenes: pruefeEigenes(p.eigenes),
    einstieg: Math.round(zahl(p.einstieg, 0, 60, d.einstieg)),
    phasen: Array.isArray(p.phasen)
      ? p.phasen.filter(x => x && hat(FORM, x.typ)).slice(0, 12).map(x => ({
          id: eigeneId(x.id), typ: x.typ,
          min: Math.round(zahl(x.min, 1, 120, 10)), groesse: Math.round(zahl(x.groesse, 3, 8, 4)), auftrag: text(x.auftrag, 600),
          fertig: text(x.fertig, 200), offen: x.offen === true, link: pruefeLink(x.link),
        }))
      : d.phasen,
    abschluss: { min: Math.round(zahl(p.abschluss?.min, 0, 60, 10)), text: text(p.abschluss?.text, 160), ha: text(p.abschluss?.ha, 400) },
    gelaufen: /^\d{4}-\d\d-\d\d$/.test(p.gelaufen) ? p.gelaufen : '',
  };
}
export function pruefeMuster(m) {
  if (!m || typeof m !== 'object' || typeof m.name !== 'string' || !m.name.trim() || !Array.isArray(m.phasen)) return null;
  const phasen = m.phasen.filter(x => x && hat(FORM, x.typ)).slice(0, 12)
    .map(x => ({ typ: x.typ, min: Math.round(zahl(x.min, 1, 120, 10)), groesse: Math.round(zahl(x.groesse, 3, 8, 4)) }));
  if (!phasen.length) return null;
  return { name: m.name.trim().slice(0, 40), einstieg: Math.round(zahl(m.einstieg, 0, 60, 5)), phasen,
    abschlussMin: Math.round(zahl(m.abschlussMin, 0, 60, 10)), material: pruefeMaterial(m.material, []), eigenes: pruefeEigenes(m.eigenes) };
}
export function pruefeKurs(k) {
  if (!k || typeof k !== 'object' || typeof k.name !== 'string' || !k.name.trim() || !/^\d{4}-\d\d-\d\d$/.test(k.datum) || !k.plan) return null;
  return { name: k.name.trim().slice(0, 20), datum: k.datum, stunde: Math.round(zahl(k.stunde, 0, STUNDEN - 1, 0)),
    plan: pruefePlan(k.plan), uebertrag: Array.isArray(k.uebertrag) ? pruefePlan({ phasen: k.uebertrag }).phasen : [],
    offenErledigt: k.offenErledigt === true };
}

/* Inhalt, den die Lehrkraft getippt hat — vor dem Überschreiben fragt die Einrichtung nach */
export const hatGetipptes = P => [P.thema, P.modul, P.ziel, P.abschluss.text, P.abschluss.ha, ...P.phasen.flatMap(p => [p.auftrag, p.fertig])].some(t => t.trim());
/* Planzeit in Minuten: Eröffnung + Phasen + Abschluss */
export const planSumme = P => P.einstieg + P.phasen.reduce((a, p) => a + p.min, 0) + P.abschluss.min;
