// Stundenverlauf · js/scanner.mjs — QR-Scanner für „Plan holen“ (Einrichtung) und „Update holen“ (Bühne).
/* Muster Werft-Arena guest.js: Kamera → BarcodeDetector, wo es ihn gibt, sonst jsQR (Apache-2.0, aus der Arena, erst beim
   ersten Scan geladen). Die Vorschau ist klein und unscharf: am Beamer gespiegelt soll niemand zu erkennen sein —
   gelesen wird das Kamerabild, nicht die Vorschau. */
import { planTeilIn } from '../logic/planlink.mjs?v=3.1.0';
import { $ } from './dom.mjs?v=3.1.0';
import { S, schreibe } from './zustand.mjs?v=3.1.0';

// jsQR trägt dieselbe Version wie dieses Modul (?v= im eigenen Pfad), sonst fände der Service Worker es nicht im Cache
const VERSION = new URL(import.meta.url).searchParams.get('v');
let scanStrom = null, scanLauf = 0, scanZiel = null;
function jsqrLaden() {
  if (window.jsQR) return Promise.resolve(true);
  return new Promise(fertig => {
    const s = document.createElement('script');
    s.src = './js/vendor/jsqr.js?v=' + VERSION;
    s.onload = () => fertig(typeof window.jsQR === 'function');
    s.onerror = () => fertig(false);
    document.head.append(s);
  });
}
// Vorschau scharf/unscharf (Zero 2026-09-30 „Scharf per Tipp“): jeder neue Scan beginnt unscharf
function vorschauScharf(an) {
  const r = $('d-scan-rahmen');
  r.setAttribute('aria-pressed', String(an));
  r.setAttribute('aria-label', an ? 'Vorschau wieder unscharf' : 'Vorschau scharf zeigen');
  $('d-scan-tipp').textContent = an ? 'Tippen: unscharf' : 'Tippen: scharf';
}
function kameraAus() {
  scanLauf++;
  scanStrom?.getTracks().forEach(t => t.stop());
  scanStrom = null;
  $('d-scan-video').srcObject = null;
}
/* ziel(hash) bekommt den gelesenen Teil „#plan=…“ */
export async function scannen(ziel) {
  const d = $('d-scan'), video = $('d-scan-video'), hinweis = $('d-scan-text');
  scanZiel = ziel;
  kameraAus();
  const lauf = scanLauf;
  hinweis.textContent = 'Kamera startet …';
  if (!d.open) { vorschauScharf(false); d.showModal(); }   // „Andere Kamera“ behält die Wahl, ein neuer Scan nicht
  if (!navigator.mediaDevices?.getUserMedia) { hinweis.textContent = 'In dieser Ansicht gibt es keinen Zugriff auf die Kamera.'; return; }
  let det = null;
  if ('BarcodeDetector' in window) try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch { det = null; }
  if (!det && !(await jsqrLaden())) { hinweis.textContent = 'Der Scanner ließ sich nicht laden.'; return; }
  // während des Ladens abgebrochen: dann auch keine Kamera anfragen (Befund 9). d.open gilt sofort, das close-Ereignis
  // (→ kameraAus) kommt erst als eigene Aufgabe — im Endlauf lud jsQR einmal schneller, und die Kamera wurde doch angefragt
  if (lauf !== scanLauf || !d.open) return;
  let strom;
  try { strom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.kamera, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { if (lauf === scanLauf) hinweis.textContent = `Die Kamera ließ sich nicht öffnen (${e?.name || 'Fehler'}). Erlaubnis in den Einstellungen prüfen.`; return; }
  if (lauf !== scanLauf || !d.open) { strom.getTracks().forEach(t => t.stop()); return; }   // inzwischen abgebrochen
  scanStrom = strom;
  video.srcObject = strom;
  try { await video.play(); } catch { /* spielt mit dem nächsten Bild */ }
  hinweis.textContent = 'Den QR-Code vom anderen Gerät vor die Kamera halten.';
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  let zuletzt = 0, fremd = false;
  const tick = async () => {
    if (lauf !== scanLauf) return;
    if (video.readyState >= 2 && performance.now() - zuletzt > 250) {
      zuletzt = performance.now();
      const w = video.videoWidth, hh = video.videoHeight, f = Math.min(1, 1024 / Math.max(w, hh));
      cv.width = Math.round(w * f); cv.height = Math.round(hh * f);
      g.drawImage(video, 0, 0, cv.width, cv.height);
      let txt = null;
      if (det) try { txt = (await det.detect(cv))[0]?.rawValue || null; } catch { det = null; jsqrLaden(); }
      if (!txt && !det && window.jsQR) txt = window.jsQR(g.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' })?.data || null;
      if (lauf !== scanLauf) return;
      if (txt) {
        const m = planTeilIn(txt);
        if (m) { kameraAus(); d.close(); scanZiel?.(m); return; }
        if (!fremd) { fremd = true; hinweis.textContent = 'Das ist kein Plan-Code aus dem Stundenverlauf.'; }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function initScanner() {
  // nach dem Schließen kehrt der Fokus auf „Update holen“ zurück — dann löste die Leertaste (Presenter, Tastatur)
  // den Scanner neu aus, statt die Uhr zu starten (Befund 10)
  $('d-scan').addEventListener('close', () => { kameraAus(); if (document.activeElement?.id === 'b-update') document.activeElement.blur(); });
  $('d-scan-zu').addEventListener('click', () => $('d-scan').close());
  $('d-scan-rahmen').addEventListener('click', () => vorschauScharf($('d-scan-rahmen').getAttribute('aria-pressed') !== 'true'));
  $('d-scan-kamera').addEventListener('click', () => { S.kamera = S.kamera === 'user' ? 'environment' : 'user'; schreibe(); scannen(scanZiel); });
}
