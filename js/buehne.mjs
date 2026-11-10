// Stundenverlauf · js/buehne.mjs — die Bühne: Ablauf der Fenster, Uhr, Verlaufsleiste, Takt, Signal, Wachhalten,
// Bearbeiten auf der Bühne (3.0). Was ein Fenster zeigt, steht in js/phasenfenster.mjs.
import { FORM, ARBEIT } from '../logic/konstanten.mjs?v=3.0.0';
import { heute, neuePhase, phaseEinsetzen, einfuegeStelle, PHASEN_MAX } from '../logic/plan.mjs?v=3.0.0';
import { kursMerken } from '../logic/kurse.mjs?v=3.0.0';
import { bauFenster, fensterName, fensterKurz, laufFrisch, neuerLauf, uhrFuer, restVon, zustand, uhrAktion, hauptWas, selbstlauf, neuAbgelaufen, nachSelbstlauf } from '../logic/uhren.mjs?v=3.0.0';
import { $, h, icon } from './dom.mjs?v=3.0.0';
import { S, lage, plan, fachAnzeige, schreibe, speichere, setzeFarbe } from './zustand.mjs?v=3.0.0';
import { segment, stepper, auftragFeld, listeWeiter } from './eingabe.mjs?v=3.0.0';
import { fensterInhalt, passeAuftragAn } from './phasenfenster.mjs?v=3.0.0';
import { malEinrichten } from './einrichtung.mjs?v=3.0.0';
import { eingangLesen } from './austausch.mjs?v=3.0.0';
import { scannen } from './scanner.mjs?v=3.0.0';

const ZEIT = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

let fensterListe = [];
let aktuell = 0;
let anzeige = null;          // Zeitscheibe des sichtbaren Fensters
const uhren = () => S.lauf.uhren;
const laufGueltig = () => laufFrisch(S) && S.lauf.stunde === S.aktiv;

function uhrKlick(u, was) {
  if (was === 'start' || was === 'weiter') audioBereit();
  uhrAktion(u, was);
  speichereLauf(); malUhr(); malVerlauf();
}
function hauptAktion() {
  if (!anzeige) return;
  const was = hauptWas(zustand(anzeige.u));
  if (was) uhrKlick(anzeige.u, was);
}

function uhrBlock(id, min) {
  const u = uhrFuer(S.lauf, id, min);
  const zahlEl = h('b', {}), unter = h('p', { class: 'uhr-unter' }), knoepfe = h('div', { class: 'uhr-knoepfe' });
  const scheibe = h('div', { class: 'scheibe' }, h('div', { class: 'zahl', role: 'timer', 'aria-live': 'off' }, zahlEl, h('span', {}, 'min')));
  anzeige = { id, u, scheibe, zahlEl, unter, knoepfe, zustand: null };
  malUhr();
  return h('div', { class: 'uhr-block' }, scheibe, unter, knoepfe);
}
function malUhr() {
  if (!anzeige) return;
  const { u, scheibe, zahlEl, unter, knoepfe } = anzeige;
  const r = restVon(u), z = zustand(u);
  // letzte Minute: „Danach“ wird zu „Gleich“ und tritt hervor
  if (anzeige.danach) {
    const bald = z === 'laeuft' && r <= 60e3;
    anzeige.danach.classList.toggle('bald', bald);
    anzeige.danach.querySelector('.danach-wort').textContent = bald ? 'Gleich:' : 'Danach:';
  }
  scheibe.style.setProperty('--anteil', String(Math.max(0, Math.min(1, r / u.gesamt))));
  zahlEl.textContent = String(Math.max(0, Math.ceil(r / 60e3)));
  unter.textContent =
    z === 'laeuft' ? `bis ${ZEIT.format(u.ende)} Uhr` :
    z === 'halt' ? 'angehalten' :
    z === 'um' ? (r <= -60e3 ? `Zeit ist um, seit ${Math.floor(-r / 60e3)} min` : 'Zeit ist um') : ' ';
  if (z === anzeige.zustand) return;
  anzeige.zustand = z;
  const k = (was, inhalt, haupt = false, label = null) =>
    h('button', { type: 'button', class: 'u-knopf' + (haupt ? ' haupt' : ''), 'aria-label': label, onclick: () => uhrKlick(u, was) }, ...inhalt);
  const minus = k('minus', ['− 1'], false, 'Eine Minute weniger'), plus = k('plus', ['+ 1'], false, 'Eine Minute mehr');
  // − 1 und + 1 brechen nur gemeinsam um: in der schmalen Spalte nie „+ 1“ allein in einer Zeile
  const paar = h('span', { class: 'u-paar' }, minus, plus);
  knoepfe.replaceChildren(...(
    z === 'bereit' ? [k('start', [icon('play'), 'Start'], true), paar] :
    // „Anhalten“ nur als Zeichen, damit die drei Knöpfe in die schmale Uhr-Spalte passen (Entwurf 2.1)
    z === 'laeuft' ? [k('halt', [icon('halt')], false, 'Anhalten'), paar] :
    z === 'halt' ? [k('weiter', [icon('play'), 'Weiter'], true), paar, k('neu', [icon('neu')], false, 'Zurücksetzen')] :
    // hat der Selbstlauf schon weitergeschaltet, liefe „+ 1“ neben der nächsten Phase her — dann nur Zurücksetzen
    [u.weiter ? null : plus, k('neu', [icon('neu')], false, 'Zurücksetzen')].filter(Boolean)));
}

function fensterMalen(f) {
  anzeige = null;
  return fensterInhalt(f, {
    liste: fensterListe,
    // „Danach“ wird zu „Gleich“, wenn die letzte Minute läuft — darum hängt es an der Anzeige der Uhr
    uhr: (id, min, danach) => { const block = uhrBlock(id, min); anzeige.danach = danach; malUhr(); return block; },
    stift: auftragBearbeiten,
  });
}

/* ─ Bearbeiten auf der Bühne (Zero 10.11.: „Ich muss die Oberfläche verlassen, um kleine Änderungen … zu machen“) ─
   Stift am Auftrag → der Kasten wird an Ort und Stelle zum Feld, die Uhr läuft weiter. „Fertig“ zeichnet das Fenster ohne
   Übergang neu. Während des Schreibens (Feld oder Einfüge-Blatt) blättert der Selbstlauf nicht; er holt es danach nach. */
let bearbeitung = null, einfuegenNeu = null, aufgeschoben = null;
/* Feldschrift beim Öffnen wie der Auftrag eingepasst (Durchspiel 10.11.: bei fest 40 px war die erste Zeile oben
   angeschnitten): größte Größe zwischen FELD_MAX und FELD_MIN px, bei der der ganze Text im Feld steht. Passt er auch
   bei FELD_MIN nicht, rollt das Feld. */
const FELD_MAX = 40, FELD_MIN = 20;
function feldEinpassen(ta) {
  const passt = px => { ta.style.fontSize = px + 'px'; return ta.scrollHeight <= ta.clientHeight + 1; };
  let gut = FELD_MAX;
  if (!passt(FELD_MAX)) {
    if (!passt(FELD_MIN)) gut = FELD_MIN;
    else { let lo = FELD_MIN, hi = FELD_MAX; for (let n = 0; n < 7; n++) { const m = (lo + hi) / 2; if (passt(m)) lo = m; else hi = m; } gut = Math.floor(lo); }
  }
  ta.style.fontSize = gut + 'px';
  ta.scrollTop = 0;
}
function auftragBearbeiten(p) {
  const raum = $('b-fenster').querySelector('.a-raum');
  if (!raum) return;
  bearbeitung = p.id;
  const ta = h('textarea', { class: 'a-feld', maxlength: '600', 'aria-label': 'Auftrag', autocomplete: 'off', spellcheck: 'true' });
  ta.value = p.auftrag;
  ta.addEventListener('input', () => { p.auftrag = ta.value; speichere(); });
  ta.addEventListener('keydown', listeWeiter);
  const fertig = h('button', { type: 'button', class: 'u-knopf haupt a-fertig', onclick: () => { bearbeitung = null; zeigeFenster(aktuell, true); } }, icon('fertig'), 'Fertig');
  raum.replaceChildren(h('div', { class: 'auftrag bearbeiten' }, h('div', { class: 'a-kopf' }, h('b', {}, 'Auftrag'), fertig), ta));
  feldEinpassen(ta);
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(ta.value.length, ta.value.length);
}
/* Phase einfügen: „+“ in der Leiste öffnet das Blatt mit dem Schreibfeld im Fokus. Eingefügt wird an der Stelle aus
   logic/plan.mjs einfuegeStelle (hinter dem gezeigten Fenster); laufende Uhr und Endzeit bleiben, das Fenster bleibt stehen. */
function phaseEinfuegenBuehne() {
  einfuegenNeu = neuePhase('einzel', 10);
  const n = einfuegenNeu;
  const formen = segment('b-neu-typ', [...ARBEIT, 'pause'].map(t => [t, FORM[t].kurz]), n.typ, v => { n.typ = v; feld.hidden = v === 'pause'; }, 'Form der neuen Phase');
  const dauer = stepper(n.min, { min: 1, max: 120, schritt: 5, einheit: 'min', label: 'Dauer' }, v => { n.min = v; });
  const feld = auftragFeld('', { placeholder: 'Auftrag', label: 'Auftrag der neuen Phase', max: 600 }, v => { n.auftrag = v; });
  $('d-einfuegen-form').replaceChildren(formen, h('div', { class: 'd-zeile' }, dauer), feld);
  $('d-einfuegen').showModal();
  feld.querySelector('textarea').focus();
}
function phaseEinfuegenJa() {
  const P = plan(), f = fensterListe[aktuell], n = einfuegenNeu;
  if (n && n.typ === 'pause') { n.auftrag = ''; n.min = Math.min(n.min, 30); }
  if (!n || !phaseEinsetzen(P, einfuegeStelle(P, f), n)) { $('d-einfuegen').close(); return; }
  einfuegenNeu = null;
  speichere();
  $('d-einfuegen').close();
  fensterListe = bauFenster(P);
  aktuell = fensterListe.findIndex(x => x.id === f.id);
  zeigeFenster(aktuell, true);
}
/* Schreiben beenden, wenn die Bühne neu beginnt, verlassen oder vom Handy erneuert wird — sonst hielte ein altes Flag den
   Selbstlauf an oder ein altes Sprungziel blätterte eine neue Stunde weiter (Prüfer Design 10.11.) */
function schreibenEnde() {
  bearbeitung = null; aufgeschoben = null; einfuegenNeu = null;
  if ($('d-einfuegen').open) $('d-einfuegen').close();
}

function malVerlauf() {
  const ol = $('b-verlauf');
  ol.replaceChildren(...fensterListe.map((f, i) => {
    const u = uhren()[f.id], z = u ? zustand(u) : null;
    const ic = f.art === 'phase' ? f.p.typ : f.art, kurz = fensterKurz(f);
    return h('li', { class: 'b-schritt' + (i === aktuell ? ' jetzt' : i < aktuell ? ' vorbei' : '') + (z === 'laeuft' && i !== aktuell ? ' laeuft' : '') },
      h('button', { type: 'button', 'aria-current': i === aktuell ? 'step' : null, 'aria-label': fensterName(f), onclick: () => zeigeFenster(i) }, icon(ic),
        h('span', {}, kurz.name, kurz.min ? h('span', { class: 's-min' }, kurz.min) : null)));
  }));
  // „+“ dort, wo die Phase landet: bei Start und Thema hinter „Thema“, beim Abschluss davor, sonst hinter dem aktuellen Schritt
  const plus = h('li', { class: 'b-plus' }, h('button', { type: 'button', 'aria-label': 'Phase einfügen', disabled: plan().phasen.length >= PHASEN_MAX, onclick: phaseEinfuegenBuehne }, icon('plus')));
  const art = fensterListe[aktuell]?.art;
  const nach = art === 'abschluss' ? ol.children[aktuell] : ol.children[art === 'start' ? 1 : aktuell]?.nextSibling;
  ol.insertBefore(plus, nach ?? null);
  ol.querySelector('.b-schritt.jetzt')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

const VT = typeof document.startViewTransition === 'function';
if (VT) document.documentElement.classList.add('vt');
const RUHIG = matchMedia('(prefers-reduced-motion: reduce)');
// still = gleiches Fenster neu zeichnen (nach Bearbeiten oder Einfügen): ohne Übergang und ohne gestaffeltes Erscheinen
function zeigeFenster(i, still = false) {
  const ziel = Math.max(0, Math.min(fensterListe.length - 1, i));
  const wechsel = ziel !== aktuell && $('b-fenster').childElementCount > 0;
  document.documentElement.dataset.richtung = ziel >= aktuell ? 'vor' : 'zurueck';
  aktuell = ziel;
  bearbeitung = null;
  const malen = () => {
    const inhalt = fensterMalen(fensterListe[aktuell]);
    // Reihenfolge des Erscheinens = Lesereihenfolge; der Titel in .soz kommt mit seinem Symbol
    if (!still) [...inhalt.querySelectorAll('.f-kicker, .f-titel, .f-unter, .f-abschnitt, .f-modul, .f-ziel, .mat-kachel, .ablauf li, .soz, .hinweis, .laut, .auftrag, .fertig, .uhr-block, .b-ziel, .rueckblick')]
      .filter(e => !e.parentElement.closest('.soz, .rueckblick'))
      .forEach((e, n) => { e.classList.add('stufe'); e.style.setProperty('--i', String(Math.min(n, 12))); });
    $('b-fenster').replaceChildren(inhalt);
    passeAuftragAn($('b-fenster'));
    $('b-vor').disabled = aktuell === 0;
    $('b-weiter').disabled = aktuell === fensterListe.length - 1;
    malVerlauf();
    speichereLauf();
  };
  if (wechsel && VT && !RUHIG.matches && document.visibilityState === 'visible') {
    // schnelles Blättern überspringt den laufenden Übergang — das ist gewollt, kein Fehler
    document.startViewTransition(malen).ready.catch(() => {});
  } else malen();
}
function speichereLauf() { if (S.lauf) { S.lauf.index = aktuell; S.lauf.stand = Date.now(); speichere(); } }

export function starteBuehne(neu) {
  schreibenEnde();
  audioBereit();
  // für „blieb offen“ und das Kurs-Gedächtnis; läuft der Plan an einem neuen Tag, gelten alte „offen“-Marken nicht mehr
  const P = plan();
  if (P.gelaufen !== heute()) P.phasen.forEach(p => { p.offen = false; });
  P.gelaufen = heute();
  speichere();   // eine gestartete Stunde ist belegt, auch ohne Eintrag
  kursMerken(S, S.aktiv, true);
  schreibe();
  if (neu || !laufGueltig()) S.lauf = neuerLauf(S.aktiv);
  fensterListe = bauFenster(plan());
  aktuell = Math.min(S.lauf.index, fensterListe.length - 1);
  malBuehnenKopf();
  $('einrichten').hidden = true;
  $('buehne').hidden = false;
  document.documentElement.classList.add('auf-buehne');
  lage.buehneAn = true;
  scrollTo(0, 0);
  wachHalten();
  takt();
  zeigeFenster(aktuell);
}
function malBuehnenKopf() {
  // ohne Malpunkt: Fach fett, Kurs normal, Lehrkraft leiser — getrennt durch Abstand (CSS .b-fach gap)
  $('b-fach').replaceChildren(h('span', { class: 'k-fach' }, fachAnzeige()), plan().kurs.trim() ? h('span', { class: 'k-kurs' }, plan().kurs.trim()) : '');
  $('b-lk').textContent = S.lehrkraft.trim();
}
/* Update vom Handy während der Stunde: Fenster neu aus dem Plan, gleiche Stelle (S.lauf.index hat planAktualisieren
   schon umgerechnet), kein Übergang — für die Klasse ändert sich nur der Inhalt */
export function buehneNeu() {
  schreibenEnde();
  fensterListe = bauFenster(plan());
  aktuell = Math.min(S.lauf?.index ?? aktuell, fensterListe.length - 1);
  setzeFarbe();
  malBuehnenKopf();
  zeigeFenster(aktuell);
}
export function zurEinrichtung() {
  schreibenEnde();
  lage.buehneAn = false;
  anzeige = null;
  $('buehne').hidden = true;
  $('einrichten').hidden = false;
  document.documentElement.classList.remove('auf-buehne');
  wachLassen();
  vollbildAus();
  malEinrichten();
}

/* Takt: Uhrzeit, Zeitscheibe, Signal bei Zeitende — auch für eine Uhr, deren Fenster gerade nicht sichtbar ist */
function takt() {
  if (!lage.buehneAn) return;
  $('b-uhr').textContent = ZEIT.format(Date.now());
  const weiter = selbstlauf(S, fensterListe);
  const um = neuAbgelaufen(S, fensterListe);
  for (const id of um) if (anzeige && anzeige.id === id) {
    anzeige.scheibe.classList.remove('klingt'); void anzeige.scheibe.offsetWidth; anzeige.scheibe.classList.add('klingt');
  }
  // ein Signal je Takt, auch wenn beim Aufholen mehrere Phasen zugleich enden
  if (um.length) gong();
  // nur vorwärts; während des Schreibens (Feld oder Einfüge-Blatt) aufgeschoben und danach nachgeholt (logic/uhren.mjs)
  const r = nachSelbstlauf(fensterListe, aktuell, weiter, aufgeschoben, !!bearbeitung || $('d-einfuegen').open);
  aufgeschoben = r.aufgeschoben;
  if (r.ziel >= 0) { zeigeFenster(r.ziel); return; }
  malUhr();
  if (um.length || weiter >= 0) { malVerlauf(); speichereLauf(); }
}
setInterval(takt, 1000);

/* Signal: zwei weiche Töne, im Browser erzeugt (keine Datei). Braucht einen Tipp vorher — Start genügt. */
let ac = null;
function audioBereit() {
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch { ac = null; }
}
function gong() {
  if (!S.signal || !ac) return;
  const t = ac.currentTime;
  for (const [f, d] of [[659.25, 0], [880, .38]]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t + d);
    g.gain.exponentialRampToValueAtTime(.22, t + d + .03);
    g.gain.exponentialRampToValueAtTime(.0001, t + d + 1.8);
    o.connect(g).connect(ac.destination);
    o.start(t + d); o.stop(t + d + 1.9);
  }
}

/* Bildschirm wach halten, solange die Fenster laufen (iPad/Beamer darf nicht dunkel werden).
   In eingebetteten Ansichten (HTML-Viewer-App, Dateianzeige der Lernplattform) sperrt die Sandbox das —
   dann sagt die Einrichtung, wie man die Auto-Sperre von Hand ausschaltet. */
let sperre = null;
let wachMoeglich = 'wakeLock' in navigator;
try { if (window.self !== window.top) wachMoeglich = false; } catch { wachMoeglich = false; }
export const wachGeht = () => wachMoeglich;
async function wachHalten() {
  try {
    if (lage.buehneAn && !sperre && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      sperre = await navigator.wakeLock.request('screen');
      sperre.addEventListener('release', () => { sperre = null; });
    }
  } catch { sperre = null; wachMoeglich = false; }
}
function wachLassen() { try { sperre?.release(); } catch {} sperre = null; }
function vollbildAus() {
  if (!(document.fullscreenElement || document.webkitFullscreenElement)) return;
  try { const p = (document.exitFullscreen || document.webkitExitFullscreen).call(document); p?.catch?.(() => {}); } catch {}
}

export function initBuehne() {
  // verborgen (App-Wechsel, anderer Tab): der Scanner schließt, damit die Kamera nicht im Hintergrund an bleibt (Befund 11)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { wachHalten(); takt(); }
    else if ($('d-scan').open) $('d-scan').close();
  });
  $('b-vor').append(icon('links'));
  $('b-weiter').append(icon('rechts'));
  $('b-zurueck').append(icon('zahnrad'));
  $('b-update').append(icon('scan'));
  $('b-update').addEventListener('click', () => scannen(hash => eingangLesen(hash, true)));
  $('b-vor').addEventListener('click', () => zeigeFenster(aktuell - 1));
  $('b-weiter').addEventListener('click', () => zeigeFenster(aktuell + 1));
  $('b-zurueck').addEventListener('click', zurEinrichtung);

  // Vollbild: in der Home-Bildschirm-App unnötig (schon randlos), in Sandbox-Ansichten abgelehnt — beides still
  const de = document.documentElement;
  const randlos = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if ((de.requestFullscreen || de.webkitRequestFullscreen) && !randlos) {
    $('b-vollbild').append(icon('vollbild'));
    $('b-vollbild').addEventListener('click', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) { vollbildAus(); return; }
      try { const p = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); p?.catch?.(() => {}); } catch {}
    });
  } else $('b-vollbild').hidden = true;

  // Phase einfügen (Blatt) und Auftrag neu einpassen, wenn sich die Bühne ändert (Drehen, geteiltes Fenster, Vollbild)
  $('d-einfuegen-ja').addEventListener('click', phaseEinfuegenJa);
  $('d-einfuegen-nein').addEventListener('click', () => { einfuegenNeu = null; $('d-einfuegen').close(); });
  new ResizeObserver(() => { if (lage.buehneAn && !bearbeitung) passeAuftragAn($('b-fenster')); }).observe($('b-fenster'));

  // iOS hält den Ton nach einem App-Wechsel an — jeder Tipp auf die Bühne weckt ihn wieder
  $('buehne').addEventListener('pointerdown', audioBereit);

  // Wischen links/rechts blättert (iPad); Tipps auf Knöpfe zählen nicht
  let wisch = null;
  const flaeche = $('b-fenster');
  flaeche.addEventListener('pointerdown', e => { wisch = e.target.closest('button, textarea, input') ? null : { x: e.clientX, y: e.clientY }; });
  flaeche.addEventListener('pointerup', e => {
    if (!wisch) return;
    const dx = e.clientX - wisch.x, dy = e.clientY - wisch.y;
    wisch = null;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 60) zeigeFenster(aktuell + (dx < 0 ? 1 : -1));
  });
  flaeche.addEventListener('pointercancel', () => { wisch = null; });

  // Tastatur und Presenter: Pfeile/Bild auf-ab blättern, Leertaste/Enter startet oder hält die Uhr
  document.addEventListener('keydown', e => {
    if (!lage.buehneAn || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
    if (e.target.closest?.('textarea, input')) return;   // im Auftragsfeld schreiben Pfeile und Leertaste Text
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); zeigeFenster(aktuell + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); zeigeFenster(aktuell - 1); }
    else if (k === 'Home') { e.preventDefault(); zeigeFenster(0); }
    else if (k === 'End') { e.preventDefault(); zeigeFenster(fensterListe.length - 1); }
    else if ((k === ' ' || k === 'Enter') && !e.target.closest('button, input, select')) { e.preventDefault(); hauptAktion(); }
  });
}
