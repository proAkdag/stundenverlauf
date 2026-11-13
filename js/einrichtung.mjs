// Stundenverlauf · js/einrichtung.mjs — die Einrichtung: Stunden des Tages, Kurs, Heute, Material, Ablauf, Start.
import { FACH_LISTE, FAECHER, MATERIAL, FORM, ARBEIT, MUSTER_MAX, formName, halb } from '../logic/konstanten.mjs?v=3.1.0';
import { heute, neuePhase, standardPlan, pruefePlan, pruefeMuster, neueId, hatGetipptes, planSumme, phaseEinsetzen, pruefeLink, PHASEN_MAX } from '../logic/plan.mjs?v=3.1.0';
import { offeneVon, letzteStunde as letzteStundeVon, planWieLetzte, offenAlsNeu, bausteinVorschlaege } from '../logic/kurse.mjs?v=3.1.0';
import { bauFenster, fensterName, laufFrisch, selbstlaufAb } from '../logic/uhren.mjs?v=3.1.0';
import { stichpunkt } from '../logic/auftragstext.mjs?v=3.1.0';
import { stundentypenFuer, planAusTyp, gleicherName } from '../logic/stundentypen.mjs?v=3.1.0';
import { verloreneTexte, musterStellen, freiAusPlan } from '../logic/vorausfuellen.mjs?v=3.1.0';
import { datumVon, vergangen } from '../logic/tage.mjs?v=3.1.0';
import { DATEN } from '../logic/bausteine_daten.mjs?v=3.1.0';
import { $, h, icon, melde } from './dom.mjs?v=3.1.0';
import { S, lage, haken, plan, fachAnzeige, schreibe, speichere, setzeFarbe } from './zustand.mjs?v=3.1.0';
import { segment, stepper, auftragFeld } from './eingabe.mjs?v=3.1.0';
import { bausteinReihe, reiheHaken } from './bausteine.mjs?v=3.1.0';
import { malTagWerkzeug, initStundenplan } from './stundenplan_ansicht.mjs?v=3.1.0';
import { starteBuehne, wachGeht } from './buehne.mjs?v=3.1.0';
import { weitergeben, eingangLesen, initAustausch } from './austausch.mjs?v=3.1.0';
import { scannen } from './scanner.mjs?v=3.1.0';
// Tageswahl im Kopf, vergangene Tage, Ausfall, „nach der Stunde“ (Klassenbuch): js/tage_ansicht.mjs
import { malTage, initTage, startErlaubt, ausfallKnopf, malAngebot } from './tage_ansicht.mjs?v=3.1.0';

const laufGueltig = () => laufFrisch(S) && S.lauf.stunde === S.aktiv;

function malAnzeige() {
  $('e-anzeige').replaceChildren(
    segment('theme', [['hell', 'Hell'], ['dunkel', 'Dunkel']], S.theme, v => { S.theme = v; setzeFarbe(); schreibe(); }, 'Anzeige'),
    h('label', { class: 'schalter' },
      h('input', { type: 'checkbox', checked: S.signal, onchange: e => { S.signal = e.target.checked; schreibe(); } }),
      'Signal am Ende'),
    // Selbstlauf (Zero 2026-09-30): ab dem Start der 1. Phase wechseln die Phasen nach Ablauf der Zeit von selbst
    h('label', { class: 'schalter' },
      h('input', { type: 'checkbox', id: 'e-selbstlauf', checked: S.selbstlauf, onchange: e => { S.selbstlauf = e.target.checked; if (S.selbstlauf) selbstlaufAb(S); schreibe(); } }),
      'Selbstlauf'),
    // Zero 10.11.: Hausaufgabe und Link (QR-Code) sind ab Werk aus; ein Feld mit Inhalt bleibt trotzdem stehen
    h('label', { class: 'schalter' },
      h('input', { type: 'checkbox', id: 'e-mit-ha', checked: S.mitHa, onchange: e => { S.mitHa = e.target.checked; schreibe(); malRahmen(); } }),
      'Hausaufgabe'),
    h('label', { class: 'schalter' },
      h('input', { type: 'checkbox', id: 'e-mit-link', checked: S.mitLink, onchange: e => { S.mitLink = e.target.checked; schreibe(); malPhasen(); } }),
      'QR-Code'));
}

/* ─── Kurs: „Wie letzte Stunde“ und „Offen vom letzten Mal“ — nur an einem anderen Tag als die letzte Stunde ─── */
const TAG_KURZ = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const datumKurz = iso => { const [j, m, t] = iso.split('-').map(Number); return TAG_KURZ.format(new Date(j, m - 1, t)); };
const letzteStunde = () => letzteStundeVon(S, plan());
function malKursAngebot() {
  const k = vergangen(S) ? null : letzteStunde();
  if (!k) { $('e-kurs-angebot').replaceChildren(); return; }
  const offen = k.offenErledigt ? [] : offeneVon(k);
  $('e-kurs-angebot').replaceChildren(
    h('button', { type: 'button', class: 'knopf kurs-weiter', onclick: wieLetzteStunde }, `Wie letzte Stunde · ${k.name} · ${datumKurz(k.datum)}`),
    offen.length ? h('div', { class: 'offen-karte' },
      h('p', {}, h('b', {}, 'Offen vom letzten Mal')),
      h('ul', {}, offen.map(p => h('li', {}, icon(p.typ), h('span', {}, formName(p) + (stichpunkt(p.auftrag) ? ' – ' + stichpunkt(p.auftrag) : ''))))),
      h('div', { class: 'offen-knoepfe' },
        h('button', { type: 'button', class: 'knopf', onclick: offenEinfuegen }, 'Vorne einfügen'),
        h('button', { type: 'button', class: 'knopf', onclick: offenVerwerfen }, 'Verwerfen'))) : '');
  // replaceChildren(…, null) schrieb „null“ als Text unter „Wie letzte Stunde“ (Befund Design 10.11., auch in 2.3.4); '' fügt nichts ein
}
function wieLetzteStunde() {
  const k = letzteStunde(), P = plan();
  if (!k) return;
  const hatInhalt = S.stunden[S.aktiv] && hatGetipptes(P);
  if (hatInhalt && !confirm(`${S.aktiv + 1}. Stunde mit der letzten Stunde der ${k.name} überschreiben?`)) return;
  S.stunden[S.aktiv] = planWieLetzte(k, P); lage.entwurf = null;
  if (S.lauf?.stunde === S.aktiv) S.lauf = null;
  k.offenErledigt = true;
  speichere(); malEinrichten();
}
function offenEinfuegen() {
  const k = letzteStunde(), P = plan();
  if (!k) return;
  const neu = offenAlsNeu(k);
  if (neu.length + P.phasen.length > 12 && !confirm('Es passen höchstens 12 Phasen – die letzten fallen dabei weg. Trotzdem vorne einfügen?')) return;
  P.phasen = [...neu, ...P.phasen].slice(0, 12);
  k.offenErledigt = true;
  speichere(); malEinrichten();
}
function offenVerwerfen() {
  const k = letzteStunde();
  if (!k) return;
  k.offenErledigt = true;
  schreibe(); malKursAngebot();
}

/* ─── Stundentypen des Fachs (logic/stundentypen.mjs): ein Tipp setzt Ablauf, Minuten und Material.
   Ein überschriebener Typ (eigenes Muster des Fachs mit seinem Namen) ist gefüllt und trägt ein ×: es holt den mitgelieferten zurück ─── */
let geladen = null;   // { plan, name }: der zuletzt in diesen Plan geladene Stundentyp oder das Muster, Namensvorschlag beim Speichern
function malTypen() {
  const typen = stundentypenFuer(DATEN, plan().fach, S.muster);
  $('e-typen').replaceChildren(...typen.map(t => {
    const laden = h('button', { type: 'button', class: 'typ-chip', 'data-typ': t.id, onclick: () => typLaden(t) }, t.name);
    return t.eigen == null ? laden : h('span', { class: 'chip typ-eigen' }, laden,
      h('button', { type: 'button', class: 'typ-weg', 'aria-label': `Eigene Fassung von ${t.name} verwerfen`, onclick: () => musterLoeschen(t.eigen) }, icon('x')));
  }));
}
function typLaden(t) {
  const P = plan(), neu = planAusTyp(t, P, S.stunde).plan, weg = verloreneTexte(P, neu);
  if (weg && !confirm(`Ablauf der ${S.aktiv + 1}. Stunde durch „${t.name}“ ersetzen? ${weg === 1 ? 'Ein Auftrag geht' : weg + ' Aufträge gehen'} dabei verloren.`)) return;
  Object.assign(P, neu); geladen = { plan: P, name: t.name };
  speichere(); malEinrichten();
}

/* ─── Muster: nur Ablauf und Material (Zero 2026-09-30) — Tipp lädt, × löscht; gezeigt werden die des Fachs und die ohne Fach.
   Ein Muster, das einen Stundentyp überschreibt, steht oben an dessen Stelle und hier nicht noch einmal ─── */
function malMuster() {
  const alsTyp = new Set(stundentypenFuer(DATEN, plan().fach, S.muster).map(t => t.eigen));
  $('e-muster').replaceChildren(
    ...musterStellen(S.muster, plan().fach).filter(i => !alsTyp.has(i)).map(i => [S.muster[i], i]).map(([m, i]) => h('span', { class: 'chip muster-chip' },
      h('button', { type: 'button', class: 'muster-laden', onclick: () => musterLaden(i) }, m.name),
      h('button', { type: 'button', 'aria-label': `Muster ${m.name} löschen`, onclick: () => musterLoeschen(i) }, icon('x')))),
    // ohne Phasen gibt es nichts zu merken
    h('button', { type: 'button', class: 'knopf muster-neu', disabled: !plan().phasen.length, onclick: musterSpeichern }, '+ Als Muster speichern'));
}
function musterSpeichern() {
  const P = plan();
  const name = prompt('Name für das Muster (z. B. Übungsstunde). Heißt es wie ein Stundentyp, ersetzt es ihn.',
    geladen?.plan === P ? geladen.name : `${P.phasen.filter(p => p.typ !== 'pause').length} Phasen · ${halb(S.stunde)} min`);
  const m = pruefeMuster({ name, einstieg: P.einstieg, phasen: P.phasen, abschlussMin: P.abschluss.min, material: P.material, eigenes: P.eigenes, experiment: P.experiment });
  if (!m) return;
  m.fach = P.fach;   // pruefeMuster kennt das Fach nicht; logic/stand_v3.mjs liest es beim Laden zurück
  // gleicher Name im selben Fach (oder ohne Fach) wird ersetzt; dasselbe Muster darf es je Fach einmal geben
  const typ = stundentypenFuer(DATEN, P.fach).find(t => gleicherName(t.name, m.name));
  const alt = S.muster.findIndex(x => (!x.fach || x.fach === m.fach) && gleicherName(x.name, m.name));
  if (alt < 0 && S.muster.length >= MUSTER_MAX) { alert(`Es gibt schon ${MUSTER_MAX} Muster. Lösche zuerst eines (×) oder ersetze eines mit gleichem Namen.`); return; }
  if (typ ? !confirm(`Stundentyp „${typ.name}“ in ${P.fach} durch diesen Ablauf ersetzen? Das × am Chip holt den mitgelieferten zurück.`)
    : alt >= 0 && !confirm(`Muster „${m.name}“ ersetzen?`)) return;
  if (alt >= 0) S.muster[alt] = m; else S.muster.push(m);
  schreibe(); malTypen(); malMuster();
}
function musterLaden(i) {
  const m = S.muster[i], P = plan();
  if (!m) return;
  if (P.phasen.some(p => p.auftrag.trim() || p.fertig.trim())
    && !confirm(`Ablauf der ${S.aktiv + 1}. Stunde durch „${m.name}“ ersetzen? Die Aufträge der Phasen gehen dabei verloren.`)) return;
  P.einstieg = m.einstieg;
  P.phasen = m.phasen.map(x => neuePhase(x.typ, x.min, x.groesse));
  P.abschluss.min = m.abschlussMin;
  P.material = [...m.material]; P.eigenes = [...m.eigenes]; geladen = { plan: P, name: m.name };
  if (m.experiment) P.experiment = true;   // wie beim Stundentyp: ein Muster schaltet an, nie aus (Zero 13.11.)
  speichere(); malEinrichten();
}
function musterLoeschen(i) {
  const m = S.muster[i];
  if (!m) return;
  const typ = stundentypenFuer(DATEN, m.fach, S.muster).find(t => t.eigen === i);
  if (!confirm(typ ? `Deine Fassung von „${typ.name}“ verwerfen? Dann gilt wieder die mitgelieferte.` : `Muster „${m.name}“ löschen?`)) return;
  S.muster.splice(i, 1);
  schreibe(); malTypen(); malMuster();
}

/* ─── Material ─── */
/* „Heute wird experimentiert“ (3.1): Schalter oben in der Karte; ist er an, steht darunter ein freiwilliger Satz für die Klasse.
   Der Satz bleibt im Plan, auch wenn der Schalter aus ist, und ist beim Wiedereinschalten wieder da. */
function malExperiment() {
  const P = plan(), satz = $('e-exp-satz');
  $('e-exp').setAttribute('aria-pressed', String(P.experiment));
  $('e-exp').replaceChildren(icon('kolben'), h('span', {}, 'Heute wird experimentiert'));
  satz.hidden = !P.experiment;
  if (document.activeElement !== satz) satz.value = P.experimentHinweis;
}
function malMaterial() {
  const P = plan();
  malExperiment();
  $('e-material').replaceChildren(...MATERIAL.map(([id, name]) => h('button', {
    type: 'button', class: 'mat-knopf', 'aria-pressed': String(P.material.includes(id)),
    onclick: () => {
      P.material = P.material.includes(id) ? P.material.filter(m => m !== id) : MATERIAL.map(m => m[0]).filter(m => m === id || P.material.includes(m));
      malMaterial(); speichere();
    },
  }, icon(id), h('span', {}, name))));
  $('e-eigen-liste').replaceChildren(...P.eigenes.map((name, i) => h('span', { class: 'chip' }, name,
    h('button', { type: 'button', 'aria-label': name + ' entfernen', onclick: () => { P.eigenes.splice(i, 1); malMaterial(); speichere(); } }, icon('x')))));
}
function eigenesHinzu() {
  const P = plan(), wert = $('e-eigen').value.trim().slice(0, 40);
  if (!wert || P.eigenes.length >= 8 || P.eigenes.includes(wert)) return;
  P.eigenes.push(wert); $('e-eigen').value = ''; malMaterial(); speichere();
}

/* ─── Ablauf: Phasen, Eröffnung, Abschluss, Zeitbudget ─── */
/* Einfügen an der Stelle (Zero 10.11.: „umständlich, eine Arbeitsphase in die Mitte hinzuzufügen, da ich immer unten starte“):
   vor der ersten, zwischen je zwei und nach der letzten Phase eine Linie. „+ Phase“ setzt dort eine Einzelarbeit (15 min) ein
   und öffnet ihr Auftragsfeld, „+ Pause“ eine Pause (5 min). Die Form wählt man danach in der Zeile. */
function einfuegeLinie(pos) {
  const P = plan(), voll = P.phasen.length >= PHASEN_MAX;
  const setze = typ => {
    const neu = neuePhase(typ, typ === 'pause' ? 5 : 15);
    if (!phaseEinsetzen(P, pos, neu)) return;
    malPhasen(); speichere();
    const feld = $('e-phasen').querySelector(`[data-id="${neu.id}"] textarea`);
    feld?.focus({ preventScroll: true });
    feld?.closest('.phase-zeile').scrollIntoView({ block: 'nearest' });
  };
  return h('li', { class: 'einfuegen', 'data-pos': String(pos) },
    h('button', { type: 'button', class: 'ein-phase', disabled: voll, 'aria-label': `Arbeitsphase an Stelle ${pos + 1} einfügen`, onclick: () => setze('einzel') }, icon('plus'), 'Phase'),
    h('button', { type: 'button', class: 'ein-pause', disabled: voll, 'aria-label': `Pause an Stelle ${pos + 1} einfügen`, onclick: () => setze('pause') }, icon('plus'), 'Pause'));
}
function malPhasen() {
  const P = plan();
  let nr = 0;
  const bausteine = bausteinVorschlaege(S, P);
  const zeilen = P.phasen.map((p, i) => {
    const pause = p.typ === 'pause';
    if (!pause) nr++;
    const kopf = h('div', { class: 'pz-kopf' },
      h('span', { class: 'nr', 'aria-hidden': 'true' }, pause ? icon('pause') : String(nr)),
      pause ? h('span', { class: 'pz-pause' }, 'Pause')
            : segment('typ-' + p.id, ARBEIT.map(t => [t, FORM[t].kurz]), p.typ, v => { p.typ = v; malPhasen(); speichere(); }, `Sozialform Arbeitsphase ${nr}`));
    // Schieben und Entfernen stehen in der Zeile der Minuten — eine Zeile weniger je Phase am Handy (Entwurf 2.4)
    const aktionen = h('div', { class: 'pz-aktionen' },
      h('button', { type: 'button', class: 'mini', 'aria-label': 'Nach oben', disabled: i === 0, onclick: () => schiebe(i, -1) }, icon('hoch')),
      h('button', { type: 'button', class: 'mini', 'aria-label': 'Nach unten', disabled: i === P.phasen.length - 1, onclick: () => schiebe(i, 1) }, icon('runter')),
      h('button', { type: 'button', class: 'mini', 'aria-label': 'Entfernen', onclick: () => { P.phasen.splice(i, 1); malPhasen(); speichere(); } }, icon('x')));
    const werte = h('div', { class: 'pz-werte' },
      stepper(p.min, { min: 1, max: 120, schritt: 5, einheit: 'min', label: 'Dauer' }, v => { p.min = v; malBudget(); speichere(); }));
    if (p.typ === 'gruppe')
      werte.append(h('span', { class: 'pz-label' }, 'Gruppen zu'),
        stepper(p.groesse, { min: 3, max: 8, schritt: 1, einheit: '', label: 'Gruppengröße' }, v => { p.groesse = v; speichere(); }));
    // nach der Stunde (heute gelaufen): was nicht geschafft wurde, wandert in die nächste Stunde des Kurses
    if (!pause && P.gelaufen === heute())
      werte.append(h('button', { type: 'button', class: 'offen-knopf', 'aria-pressed': String(p.offen),
        onclick: () => { p.offen = !p.offen; malPhasen(); speichere(); } }, h('span', { class: 'kaestchen', 'aria-hidden': 'true' }, p.offen ? icon('fertig') : null), 'blieb offen'));
    werte.append(aktionen);
    if (pause) return h('li', { class: 'phase-zeile pause', 'data-id': p.id }, kopf, werte);
    const fertig = h('input', { type: 'text', class: 'pz-fertig', value: p.fertig, maxlength: '200', autocomplete: 'off',
      placeholder: 'Fertig? Dann … (optional) – z. B. Knobelaufgabe S. 45', 'aria-label': `Fertig-Auftrag Arbeitsphase ${nr}`,
      oninput: e => { p.fertig = e.target.value; speichere(); } });
    return h('li', { class: 'phase-zeile', 'data-id': p.id }, kopf, werte,
      auftragFeld(p.auftrag, { placeholder: 'Auftrag (optional) – z. B. Buch S. 42, Nr. 3–5', label: `Auftrag Arbeitsphase ${nr}`, max: 600, klasse: 'pz-auftrag',
        reihe: ta => bausteinReihe(ta, { gruppe: 'auftrag', form: p.typ, letzte: bausteine.filter(t => t !== p.auftrag.trim()) }) },
        v => { p.auftrag = v; speichere(); }),
      h('div', { class: 'mit-reihe pz-fertig-feld' }, fertig, bausteinReihe(fertig, { gruppe: 'fertig', form: p.typ })),
      linkFeld(p, nr));
  });
  $('e-phasen').replaceChildren(einfuegeLinie(0), ...zeilen.flatMap((z, i) => [z, einfuegeLinie(i + 1)]));
  malBudget();
}
/* Material-Link je Phase (nur https://, logic/plan.mjs pruefeLink): die Bühne zeigt ihn als QR-Karte. Ohne Link nur „+ Link“,
   und das nur, wenn der Schalter „QR-Code“ an ist (S.mitLink). */
function linkFeld(p, nr) {
  if (!S.mitLink && !p.link) return null;
  const feld = h('input', { type: 'url', class: 'pz-link-feld', value: p.link || '', maxlength: '300', autocomplete: 'off', placeholder: 'https://…',
    'aria-label': `Link zum Material, Arbeitsphase ${nr}`,
    oninput: e => { const v = e.target.value.trim(); p.link = pruefeLink(v); e.target.setAttribute('aria-invalid', String(!!v && !p.link)); speichere(); } });
  const zeile = h('div', { class: 'pz-link' }, icon('link'), feld);
  if (p.link) return zeile;
  const knopf = h('button', { type: 'button', class: 'leise-knopf pz-link-knopf', onclick: () => { knopf.replaceWith(zeile); feld.focus(); } }, '+ Link');
  return knopf;
}
function schiebe(i, d) {
  const P = plan(), j = i + d;
  if (j < 0 || j >= P.phasen.length) return;
  [P.phasen[i], P.phasen[j]] = [P.phasen[j], P.phasen[i]];
  malPhasen(); speichere();
}
// Die Knopfreihe unter der Liste entfällt (Entwurf 2.4): die Einfügelinien, auch nach der letzten Phase, ersetzen sie
function malPlus() { $('e-plus').replaceChildren(); $('e-plus').hidden = true; }
function malRahmen() {
  const P = plan();
  $('e-einstieg').replaceChildren(h('span', { class: 'r-name' }, icon('start'), 'Eröffnung'),
    stepper(P.einstieg, { min: 0, max: 30, schritt: 5, einheit: 'min', label: 'Dauer der Eröffnung' }, v => { P.einstieg = v; malBudget(); speichere(); }));
  $('e-abschluss').replaceChildren(h('span', { class: 'r-name' }, icon('abschluss'), 'Abschluss'),
    stepper(P.abschluss.min, { min: 0, max: 45, schritt: 5, einheit: 'min', label: 'Dauer des Abschlusses' }, v => { P.abschluss.min = v; malBudget(); speichere(); }));
  $('e-ab-text').value = P.abschluss.text;
  if (S.mitHa || P.abschluss.ha.trim())
    $('e-ab-ha').replaceChildren(auftragFeld(P.abschluss.ha, { placeholder: 'Hausaufgabe (optional)', label: 'Hausaufgabe', max: 400,
      reihe: ta => bausteinReihe(ta, { gruppe: 'ha' }) }, v => { P.abschluss.ha = v; speichere(); }));
  else $('e-ab-ha').replaceChildren();
  $('e-ab-text-bs').replaceChildren(bausteinReihe($('e-ab-text'), { gruppe: 'abschluss' }));
}
function malBudget() {
  const P = plan();
  const summe = planSumme(P);
  const rest = S.stunde - summe;
  $('e-stunde').value = String(S.stunde);
  $('e-summe').replaceChildren('Geplant ', h('b', {}, halb(summe) + ' min'));
  $('e-luft').textContent = rest >= 0 ? `${halb(rest)} min Luft` : `${halb(-rest)} min zu viel`;
  $('e-luft').classList.toggle('zuviel', rest < 0);
}
function malStart() {
  const knoepfe = [], n = S.aktiv + 1;
  if (laufGueltig()) {
    const f = bauFenster(plan())[Math.min(S.lauf.index, bauFenster(plan()).length - 1)];
    knoepfe.push(h('button', { type: 'button', class: 'start', onclick: () => starteBuehne(false) }, icon('play'), `Zurück zur laufenden ${n}. Stunde · ${fensterName(f)}`));
    knoepfe.push(h('button', { type: 'button', class: 'start zweit', onclick: () => starteBuehne(true) }, 'Neu starten'));
  } else if (startErlaubt()) {   // nur heute, nie eine ausgefallene Stunde
    knoepfe.push(h('button', { type: 'button', class: 'start', onclick: () => starteBuehne(true) }, icon('play'), `${n}. Stunde starten`));
  }
  $('e-start-reihe').replaceChildren(...knoepfe, ausfallKnopf());
}

/* Tagesleiste: 1. bis 6. Stunde des angezeigten Tags, jede in ihrer Fachfarbe; „fällt aus“ und, am vergangenen Tag, ein Haken für „lief“ */
function malTag() {
  const ausPlan = freiAusPlan(S.stunden, S.plan, datumVon(S.tag));   // freier Platz: Fach und Kurs aus dem Stundenplan
  // Fach und Kurs mit Leerzeichen, nie mit Malpunkt (Zeros Regel: der Malpunkt ist ein Rechenzeichen)
  const fachKurs = x => fachAnzeige(x.fach) + (x.kurs.trim() ? ' ' + x.kurs.trim() : '');
  const alt = vergangen(S);
  $('e-tag').replaceChildren(...S.stunden.map((p, i) => {
    const e = ausPlan[i];
    const b = h('button', { type: 'button', class: 'tag-knopf' + (i === S.aktiv ? ' an' : '') + (p ? '' : ' frei') + (!p && e ? ' aus-plan' : '') + (p?.ausfall ? ' ausfall' : ''),
      'aria-pressed': String(i === S.aktiv), onclick: () => waehleStunde(i) },
      h('span', { class: 'tag-nr' }, `${i + 1}.`),
      h('span', { class: 'tag-text' }, h('b', {}, p ? fachKurs(p) : e ? fachKurs(e) : 'frei'),
        p?.ausfall ? h('span', { class: 'tag-ausfall' }, 'fällt aus') : p && p.thema.trim() ? h('span', {}, p.thema.trim()) : e ? h('span', {}, 'frei') : null),
      laufFrisch(S) && S.lauf.stunde === i ? h('span', { class: 'tag-laeuft', title: 'läuft' }) : null,
      alt && p?.gelaufen === S.tag ? h('span', { class: 'tag-lief', title: 'lief' }, icon('fertig')) : null);
    if (p) { const [hue, stufe] = FAECHER[p.fach]; b.style.setProperty('--hue', String(hue)); b.style.setProperty('--stufe', String(stufe)); }
    return b;
  }));
  malTagWerkzeug();
}
haken.nachSpeichern = malTag;
function waehleStunde(i) {
  if (i === S.aktiv) return;
  S.aktiv = i; lage.entwurf = null;
  schreibe(); malEinrichten();
  scrollTo(0, 0);
}
function malStundenKopf() {
  const n = S.aktiv + 1, belegt = !!S.stunden[S.aktiv];
  $('h-fach').textContent = `${n}. Stunde`;
  $('e-leeren').disabled = !belegt;
  $('e-kopie').replaceChildren(h('option', { value: '' }, 'Übernehmen aus …'),
    ...S.stunden.map((p, i) => p && i !== S.aktiv ? h('option', { value: String(i) }, `${i + 1}. Stunde · ${fachAnzeige(p.fach)}${p.thema.trim() ? ' · ' + p.thema.trim() : ''}`) : null));
  $('e-kopie').disabled = $('e-kopie').options.length < 2;
}
// In eingebetteten Ansichten kann die Seite den Bildschirm nicht wach halten — dann steht hier, wie es von Hand geht
const malWachHinweis = () => { $('e-wach').hidden = wachGeht(); };
export function malEinrichten() {
  setzeFarbe();
  const P = plan();
  $('e-fach').value = P.fach;
  $('e-kurs').value = P.kurs;
  $('e-lk').value = S.lehrkraft;
  $('e-thema').value = P.thema;
  $('e-modul').value = P.modul;
  $('e-ziel').value = P.ziel;
  $('e-ziel-bs').replaceChildren(bausteinReihe($('e-ziel'), { gruppe: 'ziel' }));
  malTag(); malStundenKopf(); malKursAngebot(); malAnzeige(); malMaterial(); malTypen(); malMuster(); malRahmen(); malPhasen(); malPlus(); malStart(); malWachHinweis();
  malTage();
}

export function initEinrichten() {
  $('e-fach').replaceChildren(...FACH_LISTE.map(f => h('option', { value: f }, f)));
  $('e-fach').addEventListener('change', e => { plan().fach = e.target.value; speichere(); malEinrichten(); });
  $('e-kurs').addEventListener('input', e => { plan().kurs = e.target.value; speichere(); malKursAngebot(); malAngebot(); });
  $('e-lk').addEventListener('input', e => { S.lehrkraft = e.target.value; schreibe(); });
  // Parallelklassen: ganze Stunde aus einer anderen übernehmen (Thema, Material, Ablauf, Aufträge) — der Kurs bleibt der eigene
  $('e-kopie').addEventListener('change', e => {
    const q = S.stunden[Number(e.target.value)], n = S.aktiv + 1;
    e.target.value = '';
    if (!q || (S.stunden[S.aktiv] && !confirm(`${n}. Stunde mit diesem Plan überschreiben?`))) return;
    const kopie = pruefePlan(JSON.parse(JSON.stringify(q)));
    kopie.pid = plan().pid;   // eine Kennung, eine Stunde: die Kopie gehört zu diesem Platz, nicht zur Quelle
    kopie.kurs = plan().kurs; kopie.gelaufen = '';
    kopie.phasen.forEach(p => { p.id = neueId(); p.offen = false; });
    S.stunden[S.aktiv] = kopie; lage.entwurf = null;
    if (S.lauf?.stunde === S.aktiv) S.lauf = null;
    speichere(); malEinrichten();
  });
  $('e-leeren').addEventListener('click', () => {
    if (!confirm(`${S.aktiv + 1}. Stunde leeren? Alles, was hier eingetragen ist, wird gelöscht.`)) return;
    S.stunden[S.aktiv] = null; lage.entwurf = null;
    if (S.lauf?.stunde === S.aktiv) S.lauf = null;
    schreibe(); malEinrichten();
  });
  $('e-thema').addEventListener('input', e => { plan().thema = e.target.value; speichere(); });
  $('e-modul').addEventListener('input', e => { plan().modul = e.target.value; speichere(); });
  $('e-ziel').addEventListener('input', e => { plan().ziel = e.target.value.replace(/\n/g, ' '); speichere(); });
  $('e-ziel').addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });   // das Ziel ist ein Satz, keine Liste
  $('e-ab-text').addEventListener('input', e => { plan().abschluss.text = e.target.value; speichere(); });
  $('e-exp').addEventListener('click', () => { const P = plan(); P.experiment = !P.experiment; malExperiment(); speichere(); });
  $('e-exp-satz').addEventListener('input', e => { plan().experimentHinweis = e.target.value; speichere(); });
  $('e-eigen-plus').addEventListener('click', eigenesHinzu);
  $('e-weitergeben').addEventListener('click', weitergeben);
  $('e-holen').addEventListener('click', () => scannen(eingangLesen));
  initAustausch();
  initStundenplan(malEinrichten);
  reiheHaken.nachAenderung = malEinrichten;
  // beim Öffnen heute; bleibt die App über Nacht offen, zeigt sie beim nächsten Blick den neuen Tag (js/tage_ansicht.mjs)
  initTage(malEinrichten);
  $('e-eigen').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); eigenesHinzu(); } });
  $('e-stunde').addEventListener('change', e => { S.stunde = Number(e.target.value); malBudget(); schreibe(); });
  $('e-reset').addEventListener('click', () => {
    if (!confirm(`Ablauf der ${S.aktiv + 1}. Stunde auf Standard zurücksetzen? Fach, Thema, Modul und Material bleiben.`)) return;
    const d = standardPlan(), P = plan();
    P.einstieg = d.einstieg; P.phasen = d.phasen; P.abschluss = d.abschluss;
    malEinrichten(); speichere();
  });
  malEinrichten();
}
