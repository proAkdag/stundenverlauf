// Verbindungstest (Stundenverlauf 2.3, Scheibe B · Zero 2026-09-30: „wenn ich beide ein Handshake machen lasse …“).
// Misst, ob Handy und iPad eine Direktverbindung (WebRTC-DataChannel) aufbauen und über welchen Weg.
// Handshake wie im Notfall-P2P der Werft-Arena (Spiele/Thema - Werft-Arena/arena_src/js/core/guest.js):
// die Verbindungsdaten werden auf ~300 Zeichen gepackt (packSDP/unpackSDP) und per QR-Code oder Einfügen getauscht.
const $ = id => document.getElementById(id);
const PRAEFIX = 'SV1';

/* ─── SDP packen/entpacken (Muster Arena guest.js; hier bis 8 Adressen, damit IPv4 und IPv6 beide mitreisen) ─── */
function packSDP(rolle, sdp) {
  const g = re => (sdp.match(re) || [])[1] || '';
  const ufrag = g(/a=ice-ufrag:([^\r\n]+)/), pwd = g(/a=ice-pwd:([^\r\n]+)/);
  const fphex = g(/a=fingerprint:sha-256 ([0-9A-F:]+)/i).replace(/:/g, '');
  const fp = btoa((fphex.match(/../g) || []).map(x => String.fromCharCode(parseInt(x, 16))).join(''));
  const kand = [], re = /a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ (host|srflx)/g;
  let m;
  while ((m = re.exec(sdp))) kand.push(m[3][0] + '~' + m[1] + '~' + m[2]);
  const roh = [PRAEFIX, rolle, ufrag, pwd, fp, kand.slice(0, 8).join(',')].join('|');
  return roh + '|' + pruefsumme(roh);
}
// Prüfsumme (FNV-1a, 32 bit): ein beim Einfügen verändertes Zeichen heißt „beschädigt“ statt 20 s später
// „keine Verbindung“ mit falscher Diagnose (Fremdprüfung 2.3, Befund 12). Der QR-Code hat seine eigene Fehlerkorrektur.
function pruefsumme(s) {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(16).padStart(8, '0');
}
function unpackSDP(text) {
  const alle = (text || '').trim().split('|');
  if (alle.length !== 7 || pruefsumme(alle.slice(0, 6).join('|')) !== alle[6]) return null;
  const p = alle.slice(0, 6);
  if (p[0] !== PRAEFIX || !['o', 'a'].includes(p[1])) return null;
  let fp = '';
  try {
    const hex = [...atob(p[4])].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase();
    fp = (hex.match(/../g) || []).join(':');
  } catch { return null; }
  if (!p[2] || !p[3] || !fp || !/^[\w+/=:.~,-]*$/.test(p[5])) return null;
  let zeilen = '';
  p[5].split(',').filter(Boolean).forEach((c, i) => {
    const s = c.split('~');
    if (s.length !== 3) return;
    zeilen += `a=candidate:${i + 1} 1 udp ${2130706431 - i} ${s[1]} ${s[2]} typ ${s[0] === 's' ? 'srflx raddr 0.0.0.0 rport 0' : 'host'} generation 0\r\n`;
  });
  const sdp = `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n`
    + `m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\n${zeilen}`
    + `a=ice-ufrag:${p[2]}\r\na=ice-pwd:${p[3]}\r\na=ice-options:trickle\r\na=fingerprint:sha-256 ${fp}\r\n`
    + `a=setup:${p[1] === 'o' ? 'actpass' : 'active'}\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n`;
  return { type: p[1] === 'o' ? 'offer' : 'answer', sdp, adressen: p[5].split(',').filter(Boolean).length };
}
const warteICE = pc => new Promise(fertig => {
  if (pc.iceGatheringState === 'complete') return fertig();
  pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') fertig(); });
  setTimeout(fertig, 5000);   // STUN über Mobilfunk kann dauern; danach mit dem, was da ist
});

/* ─── Zustand und Anzeige ─── */
let pc = null, dc = null, rolle = '', seit = 0, letzteAntwort = 0, rtts = [], zeitGeber = 0, verbindeTimer = 0;
const status = (t, art = '') => { const s = $('v-status'); s.textContent = t; s.className = 'status' + (art ? ' ' + art : ''); };
const setze = (id, t) => { $(id).textContent = t; };
const familie = a => !a ? '?' : a.endsWith('.local') ? 'verborgen (mDNS)' : a.includes(':') ? 'IPv6' : 'IPv4';
// srflx: die Daten laufen trotzdem direkt — nur die Adresse kam vom Adress-Helfer (Befund 13)
const WEG = { host: 'direkt im selben Netz', srflx: 'direkt übers Internet (Adresse vom Adress-Helfer)', prflx: 'direkt, unterwegs gefunden', relay: 'über Relay' };
function eigeneAdressen(code) {
  const k = (code.split('|')[5] || '').split(',').filter(Boolean).map(c => c.split('~'));
  if (!k.length) return 'keine gefunden';
  return k.map(([t, a]) => (t === 's' ? 'STUN' : 'Gerät') + ' ' + familie(a)).join(' · ');
}
function neuePC() {
  try { dc?.close(); pc?.close(); } catch {}
  clearInterval(zeitGeber); clearTimeout(verbindeTimer);
  seit = 0; letzteAntwort = 0; rtts = [];
  ['e-verbindung', 'e-weg', 'e-rtt', 'e-seit'].forEach(id => setze(id, '–'));
  pc = new RTCPeerConnection({ iceServers: $('v-stun').checked ? [{ urls: 'stun:stun.l.google.com:19302' }] : [] });
  // Zustand der Leitung: eine verschwundene Gegenseite meldet sich nicht ab — erst „disconnected“ (einige s), dann „failed“
  const diese = pc;
  pc.addEventListener('connectionstatechange', () => {
    if (diese !== pc) return;
    const z = pc.connectionState;
    if (!seit) { if (z === 'failed') { status('Keine Verbindung zustande gekommen. Mit und ohne Adress-Helfer probieren.', 'warn'); setze('e-verbindung', 'gescheitert'); } return; }
    if (z === 'disconnected') { status(`Verbindung unterbrochen nach ${dauer(Date.now() - seit)} – wartet, ob sie wiederkommt …`, 'warn'); setze('e-verbindung', 'unterbrochen'); }
    else if (z === 'connected') { status('✓ Verbunden (wieder da)', 'gut'); setze('e-verbindung', 'verbunden'); }
    else if (z === 'failed' || z === 'closed') abgerissen();
  });
}
function abgerissen() {
  if (!seit || $('e-verbindung').textContent === 'abgerissen') return;
  clearInterval(zeitGeber);
  status(`Verbindung abgerissen nach ${dauer(Date.now() - seit)}.`, 'warn');
  setze('e-verbindung', 'abgerissen');
}
function kanal(d) {
  dc = d;
  dc.onopen = async () => {
    clearTimeout(verbindeTimer);
    seit = Date.now(); letzteAntwort = Date.now();
    status('✓ Verbunden', 'gut');
    setze('e-verbindung', 'verbunden');
    kameraAus();
    $('v-aus').hidden = true; $('v-ein').hidden = true;   // die Codes haben ihren Dienst getan
    await wegMessen();
    zeitGeber = setInterval(takt, 1000);
  };
  dc.onmessage = e => {
    let n; try { n = JSON.parse(e.data); } catch { return; }
    if (typeof n.p === 'number') dc.readyState === 'open' && dc.send(JSON.stringify({ q: n.p }));
    if (typeof n.q === 'number') { letzteAntwort = Date.now(); rtts.push(performance.now() - n.q); rtts = rtts.slice(-10); }
  };
  dc.onclose = abgerissen;
}
const dauer = ms => { const s = Math.round(ms / 1000); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s'; };
function takt() {
  if (!dc || dc.readyState !== 'open') return;
  if ((Date.now() - seit) % 2000 < 1000) dc.send(JSON.stringify({ p: performance.now() }));
  const still = Date.now() - letzteAntwort;
  setze('e-seit', dauer(Date.now() - seit) + (still > 6000 ? ` · keine Antwort seit ${dauer(still)}` : ''));
  if (rtts.length) { const s = [...rtts].sort((a, b) => a - b); setze('e-rtt', `${Math.round(s[Math.floor(s.length / 2)])} ms (mittlerer Wert aus ${s.length} Messung${s.length > 1 ? 'en' : ''})`); }
}
async function wegMessen() {
  try {
    const st = await pc.getStats();
    let paar = null;
    st.forEach(r => { if (r.type === 'transport' && r.selectedCandidatePairId) paar = st.get(r.selectedCandidatePairId); });
    if (!paar) st.forEach(r => { if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || !paar)) paar = r; });
    if (!paar) { setze('e-weg', 'unbekannt'); return; }
    const l = st.get(paar.localCandidateId), f = st.get(paar.remoteCandidateId);
    const adr = c => c?.address || c?.ip || '';
    setze('e-weg', `${WEG[l?.candidateType] || l?.candidateType || '?'} · hier ${familie(adr(l))}, drüben ${f?.candidateType || '?'} ${familie(adr(f))}`);
  } catch { setze('e-weg', 'nicht messbar'); }
}
function zeigeCode(code, titel) {
  $('v-aus').hidden = false;
  setze('v-aus-titel', titel);
  $('v-code').value = code;
  const box = $('v-qr');
  try { const qr = qrcode(0, 'M'); qr.addData(code, 'Byte'); qr.make(); box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 12, scalable: true }); box.hidden = false; }
  catch { box.replaceChildren(); box.hidden = true; }
  setze('e-eigen', eigeneAdressen(code));
}

/* ─── Ablauf ─── */
async function einladen() {
  rolle = 'o';
  neuePC();
  kanal(pc.createDataChannel('test'));
  await pc.setLocalDescription(await pc.createOffer());
  status('Sammle Adressen …');
  await warteICE(pc);
  zeigeCode(packSDP('o', pc.localDescription.sdp), 'Einladungs-Code – am Handy „Beitreten“ und diesen Code scannen');
  $('v-ein').hidden = false;
  setze('v-ein-titel', 'Danach: Antwort-Code des Handys');
  status('Warte auf den Antwort-Code des Handys …');
}
function beitreten() {
  rolle = 'j';
  $('v-aus').hidden = true;
  $('v-ein').hidden = false;
  setze('v-ein-titel', 'Einladungs-Code des iPads');
  status('Einladungs-Code des iPads scannen oder einfügen.');
}
async function nehmen(text) {
  const u = unpackSDP(text);
  if (!u) { status('Code beschädigt oder unvollständig – bitte neu scannen.', 'warn'); return; }
  if (rolle === 'o' && u.type === 'answer') {
    try { await pc.setRemoteDescription({ type: 'answer', sdp: u.sdp }); }
    catch { status('Code beschädigt – am Handy neu beitreten.', 'warn'); return; }
    status('Verbinde …');
    verbindeTimer = setTimeout(() => { if (!seit) { status('Nach 20 s keine Verbindung. Mit und ohne Adress-Helfer probieren.', 'warn'); setze('e-verbindung', 'keine'); } }, 20000);
    return;
  }
  if (rolle === 'j' && u.type === 'offer') {
    neuePC();
    pc.ondatachannel = e => kanal(e.channel);
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: u.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
    } catch { status('Code beschädigt – bitte neu scannen.', 'warn'); return; }
    status('Sammle Adressen …');
    await warteICE(pc);
    zeigeCode(packSDP('a', pc.localDescription.sdp), 'Antwort-Code – am iPad scannen');
    $('v-ein').hidden = true;
    status('Antwort-Code am iPad scannen lassen. Die Verbindung steht, sobald oben „Verbunden“ erscheint.');
    // das Handy weiß nicht, wann das iPad scannt: nach 40 s nur ein Hinweis, kein Urteil (Befund 7) — „gescheitert“
    // meldet erst der Verbindungszustand
    verbindeTimer = setTimeout(() => { if (!seit) status('Noch nicht verbunden – hat das iPad den Antwort-Code schon gescannt? Sonst neu tauschen, mit und ohne Adress-Helfer.', 'warn'); }, 40000);
    return;
  }
  if (!rolle) { status('Erst „Einladen“ oder „Beitreten“ wählen.', 'warn'); return; }
  status(u.type === 'offer' ? 'Das ist ein Einladungs-Code – den scannt das Handy.' : 'Das ist ein Antwort-Code – den scannt das iPad.', 'warn');
}

/* ─── Kamera (Muster wie im Stundenverlauf 2.3 / Arena guest.js) ─── */
let strom = null, scanLauf = 0, kamera = 'environment';
function kameraAus() { scanLauf++; strom?.getTracks().forEach(t => t.stop()); strom = null; $('v-video').srcObject = null; $('v-kamera-rahmen').hidden = true; }
function jsqrLaden() {
  if (window.jsQR) return Promise.resolve(true);
  return new Promise(f => { const s = document.createElement('script'); s.src = './js/vendor/jsqr.js'; s.onload = () => f(true); s.onerror = () => f(false); document.head.append(s); });
}
async function scannen() {
  kameraAus();
  const lauf = scanLauf, video = $('v-video');
  if (!navigator.mediaDevices?.getUserMedia) { setze('e-kamera', 'keine Kamera-Schnittstelle in dieser Ansicht'); status('Keine Kamera – Code einfügen.', 'warn'); return; }
  let det = null;
  if ('BarcodeDetector' in window) try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch {}
  if (!det && !(await jsqrLaden())) { status('Scanner nicht geladen – Code einfügen.', 'warn'); return; }
  let s;
  try { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: kamera, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { setze('e-kamera', 'ließ sich nicht öffnen (' + (e?.name || 'Fehler') + ')'); status('Kamera nicht verfügbar – Code einfügen.', 'warn'); return; }
  if (lauf !== scanLauf) { s.getTracks().forEach(t => t.stop()); return; }
  strom = s; video.srcObject = s; $('v-kamera-rahmen').hidden = false;
  try { await video.play(); } catch {}
  setze('e-kamera', 'geöffnet (' + (kamera === 'user' ? 'vorne' : 'hinten') + ')');
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  let zuletzt = 0;
  const tick = async () => {
    if (lauf !== scanLauf) return;
    if (video.readyState >= 2 && performance.now() - zuletzt > 250) {
      zuletzt = performance.now();
      const f = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
      cv.width = Math.round(video.videoWidth * f); cv.height = Math.round(video.videoHeight * f);
      g.drawImage(video, 0, 0, cv.width, cv.height);
      let t = null;
      if (det) try { t = (await det.detect(cv))[0]?.rawValue || null; } catch { det = null; jsqrLaden(); }
      if (!t && !det && window.jsQR) t = window.jsQR(g.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' })?.data || null;
      if (lauf !== scanLauf) return;
      if (t && t.startsWith(PRAEFIX + '|')) { kameraAus(); nehmen(t); return; }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ─── Start ─── */
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
setze('e-ansicht', (standalone ? 'Home-Bildschirm-App' : 'Browser-Tab') + ' · ' + (navigator.onLine ? 'online' : 'offline'));
setze('e-kamera', navigator.mediaDevices?.getUserMedia ? 'Schnittstelle da (noch nicht geöffnet)' : 'keine Schnittstelle');
$('v-einladen').addEventListener('click', einladen);
$('v-beitreten').addEventListener('click', beitreten);
$('v-scan').addEventListener('click', scannen);
$('v-kamera').addEventListener('click', () => { kamera = kamera === 'user' ? 'environment' : 'user'; if (strom) scannen(); });
$('v-nehmen').addEventListener('click', () => { kameraAus(); nehmen($('v-einfuegen').value); });
$('v-teilen').addEventListener('click', async () => {
  const t = $('v-code').value;
  if (navigator.share) { try { await navigator.share({ text: t }); return; } catch {} }
  try { await navigator.clipboard.writeText(t); $('v-teilen').textContent = 'Kopiert'; } catch { $('v-code').select(); }
});
