// Stundenverlauf · js/stunde.mjs — Einstieg der App: Version, Start der Ansichten, Update.
// Version: APP_VERSION = CACHE_NAME im Service Worker = jedes ?v= (index.html, Importe, Cache-Liste) — beim Ändern alle heben.
/* Aufbau (3.0.0, Zero 10.11.: „alle unsere Apps modular aufgebaut mit dem Gedanken der besseren Wartbarkeit“):
     logic/   ohne DOM, mit Node-Tests (_test/node/): konstanten · plan · speicher · kurse · uhren · abgleich · planlink · auftragstext
              · bausteine_daten · stundentypen · textbausteine · stundenplan · stand_v3 · klassenbuch · sicherung · vorausfuellen · tage
     js/      Ansichten: zustand (Stand S, Schreiben) · dom · eingabe · einrichtung · bausteine · stundenplan_ansicht
              · sicherung_ansicht · tage_ansicht · buehne · phasenfenster · austausch · scanner · kern/update */
export const APP_VERSION = '3.1.0';

import { $ } from './dom.mjs?v=3.1.0';
import { pidNeu, schreibe } from './zustand.mjs?v=3.1.0';
import { initEinrichten, malEinrichten } from './einrichtung.mjs?v=3.1.0';
import { initSicherung } from './sicherung_ansicht.mjs?v=3.1.0';
import { initBuehne } from './buehne.mjs?v=3.1.0';
import { importPruefen } from './austausch.mjs?v=3.1.0';
import { initScanner } from './scanner.mjs?v=3.1.0';
import { updateStarten, updateEintrag } from './kern/update.mjs?v=3.1.0';

initEinrichten();
initScanner();
initBuehne();
updateEintrag($('e-update'), APP_VERSION);
initSicherung(APP_VERSION, malEinrichten);
if (pidNeu) schreibe(true);   // Stand vor 2.3: die neuen Kennungen gleich festhalten
importPruefen();   // mit #plan=… geöffnet (Kamera-App, geteilter Link): Plan übernehmen oder Stunde aktualisieren
updateStarten();
