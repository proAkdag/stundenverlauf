// Stundenverlauf · js/phasenfenster.mjs — was ein Fenster der Bühne zeigt: Eröffnung, Thema, Phase, Abschluss.
/* 3.0 (Zero 10.11.: „Die Uhr ist zu groß. Der Auftrag zu klein. Das Stundenziel nirgends sichtbar.“), Maße im Entwurf
   `_arbeit/design/DESIGN.md` 2.1, 2.2, 2.6: links der Auftrag, der seinen Raum füllt; rechts eine schmale Spalte mit kleinem
   Ring, „Danach“ und Material; unten das Ziel. Kein Malpunkt als Trenner in allem, was die Klasse sieht. */
import { FORM, LAUT, MAT_NAME, ABSCHLUSS_STANDARD, formName } from '../logic/konstanten.mjs?v=3.0.1';
import { stichpunkt, gliedern } from '../logic/auftragstext.mjs?v=3.0.1';
import { linkStuecke } from '../logic/vorausfuellen.mjs?v=3.0.1';
import { h, icon } from './dom.mjs?v=3.0.1';
import { S, plan, fachAnzeige } from './zustand.mjs?v=3.0.1';

const DATUM = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

/* Auftrag als Absätze und Listen (Nummern so, wie sie getippt wurden); stift = Klick auf ✎ (nur auf der Bühne) */
export function auftragKasten(titel, roh, stift = null) {
  const { bloecke, zeilen } = gliedern(roh);
  const kopf = h('div', { class: 'a-kopf' }, h('b', {}, titel),
    stift ? h('button', { type: 'button', class: 'a-stift', 'aria-label': titel + ' ändern', onclick: stift }, icon('stift')) : null);
  return h('div', { class: 'auftrag' + (zeilen > 6 ? ' sehr-lang' : zeilen > 3 ? ' lang' : '') }, kopf,
    h('div', { class: 'a-text' }, bloecke.map(b => b.art === 'p' ? h('p', {}, b.text)
      : h(b.art, { class: 'a-liste' }, b.punkte.map(x => h('li', { value: x.nr }, x.text))))));
}

/* Auftrag füllt seinen Raum: größte Schrift zwischen A_MAX und A_MIN (Anteil der kürzeren Bildschirmkante, mindestens
   14 px), bei der der ganze Text passt. Passt er auch klein nicht, rollt der Kasten statt abzuschneiden. Läuft nach jedem
   Malen und bei jeder Größenänderung der Bühne. */
const A_MAX = 6.4, A_MIN = 2.2, A_MIN_PX = 14;
export function passeAuftragAn(fenster) {
  const vmin = Math.min(innerWidth, innerHeight) / 100;
  for (const raum of fenster.querySelectorAll('.a-raum')) {
    const k = raum.querySelector(':scope > .auftrag:not(.bearbeiten)');
    if (!k) continue;
    const hoch = Math.max(A_MIN_PX, A_MAX * vmin), tief = Math.max(A_MIN_PX, A_MIN * vmin);
    k.classList.remove('rollt');
    // der Kasten hat die feste Höhe des Raums; er passt, solange sein Inhalt nicht über den Rand reicht
    const passt = px => { k.style.fontSize = px.toFixed(1) + 'px'; return k.scrollHeight <= k.clientHeight + 1; };
    let gut = hoch;
    if (!passt(hoch)) {
      if (!passt(tief)) { gut = tief; k.classList.add('rollt'); }
      else { let lo = tief, hi = hoch; for (let n = 0; n < 9; n++) { const m = (lo + hi) / 2; if (passt(m)) lo = m; else hi = m; } gut = lo; }
    }
    k.style.fontSize = gut.toFixed(1) + 'px';
  }
}

/* Ziel als ruhige Zeile unten in jedem Phasenfenster. Ohne Ziel kein Element, also keine leere Stelle. */
function zielZeile(P) {
  const ziel = P.ziel.trim();
  return ziel ? h('p', { class: 'b-ziel' }, icon('ziel'), h('span', { class: 'b-ziel-wort' }, 'Ziel'), h('span', { class: 'b-ziel-text' }, ziel)) : null;
}
/* Material: Link zum Werk als QR-Code und Kurzform — nur mit Link (logic/plan.mjs lässt nur https:// durch) */
function materialKarte(p) {
  const link = (p.link || '').trim();
  if (!link || typeof qrcode !== 'function') return null;
  let svg = '';
  try { const qr = qrcode(0, 'M'); qr.addData(link, 'Byte'); qr.make(); svg = qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true }); } catch { return null; }
  const qrBox = h('div', { class: 'pm-qr', 'aria-hidden': 'true' });
  qrBox.innerHTML = svg;   // SVG aus qrcode-generator, nur Rechtecke; der Link selbst steht als Text daneben
  const kurz = link.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // Umbruch nur hinter / . ? & = - _ (logic/vorausfuellen.mjs linkStuecke), nie mitten im Wort
  const stuecke = linkStuecke(kurz).flatMap((s, i) => i ? [h('wbr'), s] : [s]);
  return h('div', { class: 'p-material' }, qrBox, h('p', { class: 'pm-link' }, icon('link'), h('span', {}, ...stuecke)));
}

/* Inhalt eines Fensters. ctx: liste (alle Fenster), uhr(id, min, danach) → Uhr-Block, stift(p) → Auftrag bearbeiten */
export function fensterInhalt(f, ctx) {
  const P = plan();
  if (f.art === 'start') {
    const mat = [...P.material.map(id => [id, MAT_NAME[id]]), ...P.eigenes.map(n => ['eigenes', n])];
    return h('div', { class: 'f-start' },
      h('p', { class: 'f-kicker' }, DATUM.format(new Date())),
      h('h1', { class: 'f-titel' }, 'Willkommen in ', h('span', { class: 'fachwort' }, fachAnzeige())),
      S.lehrkraft.trim() ? h('p', { class: 'f-unter' }, 'bei ' + S.lehrkraft.trim()) : null,
      mat.length ? [
        h('h2', { class: 'f-abschnitt' }, 'Du benötigst heute:'),
        h('ul', { class: 'mat-reihe' }, mat.map(([ic, name]) => h('li', { class: 'mat-kachel' }, icon(ic), name))),
      ] : null);
  }
  if (f.art === 'heute') {
    const thema = P.thema.trim(), modul = P.modul.trim();
    // Stichpunkte (Zero 2026-09-30: „ganz kurz“, „ohne Mehraufwand“): die erste Zeile des Auftrags, gekürzt.
    // Sobald eine Phase einen hat, ersetzen sie das „zuerst/dann“ — die Reihenfolge trägt die Liste selbst.
    const stich = [...P.phasen.map(p => p.typ === 'pause' ? '' : stichpunkt(p.auftrag)), stichpunkt(P.abschluss.text)];
    const mitStich = stich.some(Boolean);
    const zeile = (wann, ic, name, min, s) => h('li', {}, icon(ic),
      h('span', { class: 'was' }, mitStich ? null : h('span', { class: 'wann' }, wann), h('span', { class: 'name' }, name), s ? h('span', { class: 'stich' }, s) : null),
      h('span', { class: 'dauer' }, min ? min + ' min' : ''));
    const zeilen = P.phasen.map((p, i) => zeile(i === 0 ? 'zuerst' : 'dann', p.typ, formName(p), p.min, stich[i]));
    zeilen.push(zeile('zum Schluss', 'abschluss', 'Abschluss', P.abschluss.min, stich.at(-1)));
    const ziel = P.ziel.trim();
    return h('div', { class: 'f-heute' },
      h('div', {},
        h('p', { class: 'f-kicker' }, thema ? 'Heute ist Thema' : 'Heute'),
        h('h1', { class: 'f-titel' }, thema || modul || 'So läuft die Stunde'),
        thema && modul ? h('p', { class: 'f-modul' }, icon('modul'), modul) : null,
        ziel ? h('p', { class: 'f-ziel' }, icon('ziel'), h('span', {}, h('b', {}, 'Ziel'), ziel)) : null),
      h('div', {},
        h('p', { class: 'f-kicker' }, 'So arbeitest du heute'),
        h('ol', { class: 'ablauf' + (zeilen.length > 6 ? ' dicht' : '') }, zeilen)));
  }
  if (f.art === 'phase') {
    const p = f.p, stufe = FORM[p.typ].laut, pause = p.typ === 'pause';
    // die drei Fragen der Klasse: Was mache ich? (Titel, Auftrag) · Wie lange noch? (Ring) · Was kommt danach? (Zeile darunter)
    const naechstes = ctx.liste[ctx.liste.indexOf(f) + 1];
    const danach = naechstes && naechstes.art === 'phase'
      ? h('p', { class: 'danach' }, icon('danach'), h('span', { class: 'danach-wort' }, 'Danach:'), h('span', {}, formName(naechstes.p), h('span', { class: 'd-min' }, `${naechstes.p.min} min`)))
      : naechstes ? h('p', { class: 'danach' }, icon('danach'), h('span', { class: 'danach-wort' }, 'Danach:'), h('span', {}, 'Abschluss')) : null;
    const block = ctx.uhr(p.id, p.min, danach);
    const raum = pause ? null : h('div', { class: 'a-raum' },
      p.auftrag.trim() ? auftragKasten('Auftrag', p.auftrag, () => ctx.stift(p))
        : h('button', { type: 'button', class: 'a-leer', onclick: () => ctx.stift(p) }, icon('stift'), 'Auftrag'));
    return h('div', { class: 'f-phase' + (pause ? ' ist-pause' : '') },
      h('div', { class: 'p-links' },
        h('div', { class: 'p-kopf' },
          h('div', { class: 'soz' }, icon(p.typ),
            h('div', { class: 'soz-text' },
              h('p', { class: 'f-kicker' }, pause ? 'Zwischendurch' : `Arbeitsphase ${f.nr}`),
              h('h1', { class: 'f-titel' }, FORM[p.typ].name))),
          h('div', { class: 'hinweis-zeile' },
            h('p', { class: 'hinweis' }, FORM[p.typ].hinweis(p)),
            stufe == null ? null : h('p', { class: 'laut', 'data-stufe': String(stufe), 'aria-label': 'Lautstärke: ' + LAUT[stufe] },
              icon(stufe === 0 ? 'still' : 'laut'),
              h('span', { class: 'balken', 'aria-hidden': 'true' }, [1, 2, 3].map(n => h('i', { class: n <= stufe ? 'an' : '' }))),
              h('span', {}, LAUT[stufe])))),
        raum,
        !pause && p.fertig.trim() ? h('div', { class: 'fertig' }, h('b', {}, icon('fertig'), 'Fertig? Dann'), h('p', {}, p.fertig.trim())) : null,
        zielZeile(P)),
      h('div', { class: 'p-rechts' }, block, danach, materialKarte(p)));
  }
  // Abschluss ohne Uhr (Zero 2026-09-30) — seine Minuten zählen nur für die Planung. Mit Ziel daneben der Rückblick
  // und der Selbstcheck mit zwei Smileys, Bild ohne Text (Gedächtnis „selbstcheck-zwei-smileys“)
  const ab = P.abschluss, ziel = P.ziel.trim();
  return h('div', { class: 'f-abschluss' + (ziel ? '' : ' ohne-ziel') },
    h('div', {},
      h('div', { class: 'soz' }, icon('abschluss'),
        h('div', { class: 'soz-text' }, h('p', { class: 'f-kicker' }, 'Zum Schluss'), h('h1', { class: 'f-titel' }, 'Abschluss'))),
      h('p', { class: 'hinweis' }, ab.text.trim() || ABSCHLUSS_STANDARD),
      ab.ha.trim() ? auftragKasten('Hausaufgabe', ab.ha) : null),
    ziel ? h('section', { class: 'rueckblick', 'aria-label': 'Rückblick auf das Ziel' },
      h('p', { class: 'f-kicker' }, icon('ziel'), 'Unser Ziel heute'),
      h('p', { class: 'rb-ziel' + (ziel.length > 90 ? ' lang' : '') }, ziel),
      h('div', { class: 'selbstcheck' },
        h('img', { src: './bilder/smiley_verstanden.png', alt: 'verstanden', width: '256', height: '256' }),
        h('img', { src: './bilder/smiley_nicht_ganz.png', alt: 'Das übe ich noch', width: '256', height: '256' }))) : null);
}
