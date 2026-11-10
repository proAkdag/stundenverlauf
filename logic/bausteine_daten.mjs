// Stundenverlauf · logic/bausteine_daten.mjs — erzeugt aus _arbeit/konzept/bausteine.json von werkzeug/daten_erzeugen.mjs.
// Nicht von Hand ändern: Quelle ist das JSON. Mitgelieferte Textbausteine und Stundentypen, sie ziehen mit jedem Update nach.
export const DATEN = {
  "_hinweis": "Textbausteine und Stundentypen für den Stundenverlauf 3.0. Daten, kein Code. {X} ist eine Lücke: Tipp auf den Baustein, die Lücke ausfüllen, einfügen. Sprache wie an der Tafel: kurze Hauptsätze, echte Umlaute, kein Malpunkt als Trenner, keine Namen. Prüfung: node pruefe_bausteine.mjs",
  "schema": 1,
  "grenzen": { "auftrag": 600, "fertig": 200, "ziel": 160, "abschluss": 160, "ha": 400, "luecke": 40, "kuerzel": 12 },
  "gruppen": ["auftrag", "fertig", "ziel", "abschluss", "ha"],
  "gemeinsam": {
    "bausteine": [
      { "id": "g-wir-klaeren", "gruppe": "auftrag", "kuerzel": "klaeren", "formen": ["plenum"], "text": "Wir klären gemeinsam:" },
      { "id": "g-wir-wiederholen", "gruppe": "auftrag", "kuerzel": "wiederh", "formen": ["plenum"], "text": "Wir wiederholen kurz:" },
      { "id": "g-wir-sammeln", "gruppe": "auftrag", "kuerzel": "sammeln", "formen": ["plenum"], "text": "Wir sammeln an der Tafel:" },
      { "id": "g-zu-zweit-vergleichen", "gruppe": "auftrag", "kuerzel": "vergl2", "formen": ["partner"], "text": "Vergleicht zu zweit eure Ergebnisse." },
      { "id": "g-erklaert-euch", "gruppe": "auftrag", "kuerzel": "erklaert", "formen": ["partner", "gruppe"], "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Erklärt euch gegenseitig {X}." },
      { "id": "g-rechnet-zu-zweit", "gruppe": "auftrag", "kuerzel": "rechn2", "formen": ["partner"], "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Rechnet zu zweit {X}." },
      { "id": "g-ins-heft-ihr", "gruppe": "auftrag", "kuerzel": "heftihr", "formen": ["partner", "gruppe", "plenum"], "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Schreibt {X} ins Heft." },
      { "id": "g-ins-heft-du", "gruppe": "auftrag", "kuerzel": "heftdu", "formen": ["einzel"], "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Schreibe {X} ins Heft." },
      { "id": "g-notiere-heft", "gruppe": "auftrag", "kuerzel": "notiere", "formen": ["einzel"], "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Notiere im Heft: {X}" },
      { "id": "g-buch", "gruppe": "auftrag", "kuerzel": "buch", "luecken": [{ "name": "S", "hinweis": "Seite", "tastatur": "zahl" }, { "name": "N", "hinweis": "Nummern" }], "text": "Buch S. {S}, Nr. {N}." },
      { "id": "g-arbeitsblatt", "gruppe": "auftrag", "kuerzel": "ab", "luecken": [{ "name": "A", "hinweis": "Blatt" }, { "name": "N", "hinweis": "Aufgaben" }], "text": "Arbeitsblatt {A}, Aufgabe {N}." },
      { "id": "g-werk-du", "gruppe": "auftrag", "kuerzel": "werkdu", "formen": ["einzel"], "luecken": [{ "name": "W", "hinweis": "Werk", "quelle": "werk" }], "text": "Öffne das Werk „{W}“." },
      { "id": "g-werk-ihr", "gruppe": "auftrag", "kuerzel": "werkihr", "formen": ["partner", "gruppe"], "luecken": [{ "name": "W", "hinweis": "Werk", "quelle": "werk" }], "text": "Öffnet das Werk „{W}“." },
      { "id": "g-raum-und-du", "gruppe": "auftrag", "kuerzel": "raumund", "formen": ["einzel"], "luecken": [{ "name": "R", "hinweis": "Raum", "quelle": "raum" }, { "name": "R2", "hinweis": "Raum", "quelle": "raum" }], "text": "Arbeite Raum {R} und Raum {R2}." },
      { "id": "g-raum-bis-du", "gruppe": "auftrag", "kuerzel": "raumbis", "formen": ["einzel"], "luecken": [{ "name": "R", "hinweis": "Raum", "quelle": "raum" }, { "name": "R2", "hinweis": "Raum", "quelle": "raum" }], "text": "Arbeite Raum {R} bis Raum {R2}." },
      { "id": "g-raum-und-ihr", "gruppe": "auftrag", "kuerzel": "raumundi", "formen": ["partner", "gruppe"], "luecken": [{ "name": "R", "hinweis": "Raum", "quelle": "raum" }, { "name": "R2", "hinweis": "Raum", "quelle": "raum" }], "text": "Arbeitet Raum {R} und Raum {R2}." },
      { "id": "g-raum-bis-ihr", "gruppe": "auftrag", "kuerzel": "raumbisi", "formen": ["partner", "gruppe"], "luecken": [{ "name": "R", "hinweis": "Raum", "quelle": "raum" }, { "name": "R2", "hinweis": "Raum", "quelle": "raum" }], "text": "Arbeitet Raum {R} bis Raum {R2}." },
      { "id": "g-vergleicht-paar", "gruppe": "auftrag", "kuerzel": "paar", "formen": ["partner"], "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Vergleicht {X} mit einem anderen Paar." },
      { "id": "g-hilf", "gruppe": "fertig", "kuerzel": "hilf", "text": "Hilf einer Person, die noch nicht fertig ist." },
      { "id": "g-beginne", "gruppe": "fertig", "kuerzel": "beginne", "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Beginne mit {X}." },
      { "id": "g-knobel", "gruppe": "fertig", "kuerzel": "knobel", "luecken": [{ "name": "S", "hinweis": "Seite", "tastatur": "zahl" }], "text": "Knobelaufgabe: Buch S. {S}." },
      { "id": "g-kontrolle", "gruppe": "fertig", "kuerzel": "kontroll", "text": "Kontrolliere deine Ergebnisse mit der Lösung." },
      { "id": "g-wir-sichern", "gruppe": "abschluss", "kuerzel": "sichern", "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Wir sichern {X}." },
      { "id": "g-wir-klaeren-offen", "gruppe": "abschluss", "kuerzel": "offen", "luecken": [{ "name": "X", "hinweis": "Thema" }], "text": "Wir klären offene Fragen zu {X}." },
      { "id": "g-wir-halten", "gruppe": "abschluss", "kuerzel": "halten", "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Wir halten {X} fest." },
      { "id": "g-wir-vergleichen", "gruppe": "abschluss", "kuerzel": "vergl", "text": "Wir vergleichen die Ergebnisse." },
      { "id": "g-ha-beende", "gruppe": "ha", "kuerzel": "beende", "luecken": [{ "name": "X", "hinweis": "was" }], "text": "Beende {X}." },
      { "id": "g-ha-buch", "gruppe": "ha", "kuerzel": "habuch", "luecken": [{ "name": "S", "hinweis": "Seite", "tastatur": "zahl" }, { "name": "N", "hinweis": "Nummern" }], "text": "Buch S. {S}, Nr. {N}." },
      { "id": "g-ha-erklaere", "gruppe": "ha", "kuerzel": "haerkl", "luecken": [{ "name": "N", "hinweis": "Zahl" }, { "name": "F", "hinweis": "Frage" }], "text": "Erkläre in {N} Sätzen, {F}." },
      { "id": "g-ha-woerter", "gruppe": "ha", "kuerzel": "hawort", "luecken": [{ "name": "W", "hinweis": "Wörter" }], "text": "Benutze die Wörter {W}." },
      { "id": "g-ha-lernen", "gruppe": "ha", "kuerzel": "lernen", "text": "Lerne die Merksätze." },
      { "id": "g-ziel-kannst", "gruppe": "ziel", "kuerzel": "ziel", "luecken": [{ "name": "F", "hinweis": "Ziel" }], "text": "Am Ende kannst du {F}." },
      { "id": "g-ziel-erklaeren", "gruppe": "ziel", "kuerzel": "zielerkl", "luecken": [{ "name": "F", "hinweis": "Ziel" }], "text": "Am Ende kannst du erklären, {F}." }
    ]
  },
  "faecher": {
    "Mathematik": {
      "bausteine": [
        { "id": "ma-rechne-heft", "gruppe": "auftrag", "kuerzel": "rechne", "formen": ["einzel"], "text": "Rechne die Aufgaben im Heft. Schreibe den Rechenweg auf." },
        { "id": "ma-rechnet-heft", "gruppe": "auftrag", "kuerzel": "rechnet", "formen": ["partner", "gruppe"], "text": "Rechnet die Aufgaben im Heft. Schreibt den Rechenweg auf." },
        { "id": "ma-probe-du", "gruppe": "auftrag", "kuerzel": "probe", "formen": ["einzel"], "text": "Mache die Probe." },
        { "id": "ma-probe-ihr", "gruppe": "auftrag", "kuerzel": "probei", "formen": ["partner", "gruppe"], "text": "Macht die Probe." },
        { "id": "ma-kuerzen", "gruppe": "auftrag", "kuerzel": "kuerzen", "text": "Kürze das Ergebnis so weit wie möglich." },
        { "id": "ma-taschenrechner", "gruppe": "auftrag", "kuerzel": "tr", "luecken": [{ "name": "D", "hinweis": "Stellen", "tastatur": "zahl" }], "text": "Rechne mit dem Taschenrechner. Runde auf {D} Nachkommastellen." },
        { "id": "ma-sachaufgabe", "gruppe": "auftrag", "kuerzel": "sach", "text": "Löse die Sachaufgaben. Schreibe einen Antwortsatz." },
        { "id": "ma-musterloesung", "gruppe": "auftrag", "kuerzel": "muster", "text": "Vergleiche deine Lösung mit der Musterlösung." },
        { "id": "ma-regel", "gruppe": "auftrag", "kuerzel": "regel", "text": "Schreibe die Regel mit eigenen Worten ins Heft." },
        { "id": "ma-merkkasten", "gruppe": "auftrag", "kuerzel": "merk", "text": "Lies den Merkkasten. Schreibe die Regel ab." },
        { "id": "ma-zeichne", "gruppe": "auftrag", "kuerzel": "zeichne", "text": "Zeichne die Figur mit Lineal und Geodreieck." },
        { "id": "ma-fehler", "gruppe": "auftrag", "kuerzel": "fehler", "text": "Suche den Fehler im Rechenweg. Rechne richtig." },
        { "id": "ma-tabelle", "gruppe": "auftrag", "kuerzel": "tabelle", "text": "Fülle die Wertetabelle aus." },
        { "id": "ma-erfinde", "gruppe": "fertig", "kuerzel": "erfinde", "text": "Erfinde eine eigene Aufgabe. Tausche sie mit der Person neben dir." },
        { "id": "ma-sichern-beispiel", "gruppe": "abschluss", "kuerzel": "beispiel", "text": "Wir sichern die Regel an einem Beispiel." },
        { "id": "ma-typische-fehler", "gruppe": "abschluss", "kuerzel": "tyfehler", "text": "Wir besprechen typische Fehler." },
        { "id": "ma-ha-ab", "gruppe": "ha", "kuerzel": "haab", "luecken": [{ "name": "A", "hinweis": "Blatt" }], "text": "Rechne Arbeitsblatt {A} zu Ende." },
        { "id": "ma-ha-wiederhole", "gruppe": "ha", "kuerzel": "hawied", "luecken": [{ "name": "S", "hinweis": "Seite", "tastatur": "zahl" }, { "name": "N", "hinweis": "Nummern" }], "text": "Wiederhole die Regel. Rechne Buch S. {S}, Nr. {N}." }
      ],
      "stundentypen": [
        { "id": "ma-einfuehrung", "name": "Einführung", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 15 }, { "typ": "einzel", "min": 20 }, { "typ": "partner", "min": 15 }], "abschlussMin": 10, "material": ["heft", "schreibzeug", "taschenrechner"], "eigenes": [] },
        { "id": "ma-uebung", "name": "Übung", "einstieg": 5, "phasen": [{ "typ": "einzel", "min": 25 }, { "typ": "pause", "min": 5 }, { "typ": "partner", "min": 20 }], "abschlussMin": 10, "material": ["heft", "schreibzeug", "taschenrechner"], "eigenes": [] },
        { "id": "ma-werk", "name": "Werk", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 10 }, { "typ": "einzel", "min": 30 }, { "typ": "partner", "min": 10 }], "abschlussMin": 10, "material": ["ipad", "heft", "schreibzeug"], "eigenes": [] },
        { "id": "ma-rueckgabe", "name": "Rückgabe einer Arbeit", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 15 }, { "typ": "einzel", "min": 25 }, { "typ": "partner", "min": 10 }], "abschlussMin": 10, "material": ["heft", "schreibzeug", "taschenrechner"], "eigenes": [] },
        { "id": "ma-wiederholung", "name": "Wiederholung", "einstieg": 5, "phasen": [{ "typ": "einzel", "min": 20 }, { "typ": "partner", "min": 20 }, { "typ": "plenum", "min": 10 }], "abschlussMin": 10, "material": ["heft", "schreibzeug"], "eigenes": [] }
      ]
    },
    "Physik": {
      "bausteine": [
        { "id": "ph-anleitung", "gruppe": "auftrag", "kuerzel": "anleit", "formen": ["partner", "gruppe"], "text": "Lest die Versuchsanleitung genau durch." },
        { "id": "ph-aufbau", "gruppe": "auftrag", "kuerzel": "aufbau", "formen": ["partner", "gruppe"], "text": "Holt euer Material und baut den Versuch auf." },
        { "id": "ph-durchfuehren", "gruppe": "auftrag", "kuerzel": "durchf", "formen": ["partner", "gruppe"], "text": "Führt den Versuch durch. Notiert, was ihr beobachtet." },
        { "id": "ph-zeichnet-aufbau", "gruppe": "auftrag", "kuerzel": "skizze", "formen": ["partner", "gruppe"], "text": "Zeichnet euren Aufbau ins Heft." },
        { "id": "ph-messwerte", "gruppe": "auftrag", "kuerzel": "messw", "formen": ["partner", "gruppe"], "text": "Notiert eure Messwerte in der Tabelle." },
        { "id": "ph-vermutung", "gruppe": "auftrag", "kuerzel": "vermut", "formen": ["partner", "gruppe"], "text": "Formuliert eine Vermutung. Begründet sie." },
        { "id": "ph-aufraeumen", "gruppe": "auftrag", "kuerzel": "aufraum", "formen": ["partner", "gruppe"], "text": "Räumt euren Platz auf. Gebt das Material zurück." },
        { "id": "ph-sicherheit", "gruppe": "auftrag", "kuerzel": "sicher", "luecken": [{ "name": "R", "hinweis": "Regel" }], "text": "Beachtet die Sicherheitsregel: {R}" },
        { "id": "ph-auswerten", "gruppe": "auftrag", "kuerzel": "auswert", "luecken": [{ "name": "F", "hinweis": "Leitfrage" }], "text": "Wertet den Versuch aus. Beantwortet die Leitfrage: {F}" },
        { "id": "ph-fachwoerter", "gruppe": "auftrag", "kuerzel": "fachw", "formen": ["einzel"], "text": "Beschreibe die Beobachtung mit Fachwörtern." },
        { "id": "ph-modell", "gruppe": "auftrag", "kuerzel": "modell", "text": "Erkläre die Beobachtung mit dem Kern-Hülle-Modell." },
        { "id": "ph-je-desto", "gruppe": "auftrag", "kuerzel": "jedesto", "text": "Formuliere einen Je-desto-Satz." },
        { "id": "ph-f-skizze", "gruppe": "fertig", "kuerzel": "fskizze", "formen": ["einzel"], "text": "Zeichne deine Beobachtung ins Heft." },
        { "id": "ph-a-tafel", "gruppe": "abschluss", "kuerzel": "tafel", "text": "Wir sammeln die Beobachtungen an der Tafel." },
        { "id": "ph-ha-protokoll", "gruppe": "ha", "kuerzel": "protok", "text": "Schreibe ein Versuchsprotokoll." }
      ],
      "stundentypen": [
        { "id": "ph-einfuehrung", "name": "Einführung", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 15 }, { "typ": "partner", "min": 20 }, { "typ": "plenum", "min": 15 }], "abschlussMin": 10, "material": ["heft", "schreibzeug"], "eigenes": [] },
        { "id": "ph-experiment", "name": "Experiment", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 10 }, { "typ": "gruppe", "min": 25, "groesse": 4 }, { "typ": "partner", "min": 15 }], "abschlussMin": 10, "material": ["ipad", "heft", "schreibzeug"], "eigenes": [] },
        { "id": "ph-uebung", "name": "Übung", "einstieg": 5, "phasen": [{ "typ": "einzel", "min": 25 }, { "typ": "pause", "min": 5 }, { "typ": "partner", "min": 20 }], "abschlussMin": 10, "material": ["heft", "schreibzeug", "taschenrechner"], "eigenes": [] },
        { "id": "ph-rueckgabe", "name": "Rückgabe einer Arbeit", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 15 }, { "typ": "einzel", "min": 25 }, { "typ": "partner", "min": 10 }], "abschlussMin": 10, "material": ["heft", "schreibzeug"], "eigenes": [] },
        { "id": "ph-auswertung", "name": "Auswertung", "einstieg": 5, "phasen": [{ "typ": "partner", "min": 20 }, { "typ": "gruppe", "min": 20, "groesse": 4 }, { "typ": "plenum", "min": 10 }], "abschlussMin": 10, "material": ["heft", "schreibzeug"], "eigenes": [] }
      ]
    },
    "Informatik": {
      "bausteine": [
        { "id": "in-lernpaket", "gruppe": "auftrag", "kuerzel": "paket", "luecken": [{ "name": "L", "hinweis": "Lernpaket", "quelle": "werk" }], "text": "Öffne das Lernpaket {L} in Moodle." },
        { "id": "in-paket-ablauf", "gruppe": "auftrag", "kuerzel": "ablauf", "text": "1. Vorlage holen und in Dateien sichern\n2. In Pages arbeiten\n3. Word-Datei ins Lernpaket einlegen" },
        { "id": "in-gold", "gruppe": "auftrag", "kuerzel": "gold", "text": "Arbeite, bis alles Gold ist." },
        { "id": "in-pdf-export", "gruppe": "auftrag", "kuerzel": "pdfex", "text": "Exportiere die Arbeit als PDF." },
        { "id": "in-pdf-abgeben", "gruppe": "auftrag", "kuerzel": "pdfab", "text": "Gib die PDF in Moodle ab." },
        { "id": "in-abgabe-pruefen", "gruppe": "auftrag", "kuerzel": "abgpruef", "text": "Prüfe, ob in Moodle „Zur Bewertung abgegeben“ steht." },
        { "id": "in-speichern", "gruppe": "auftrag", "kuerzel": "sichern", "luecken": [{ "name": "O", "hinweis": "Ordner" }], "text": "Speichere deine Arbeit im Ordner {O}." },
        { "id": "in-testen", "gruppe": "auftrag", "kuerzel": "testen", "text": "Teste dein Ergebnis. Suche Fehler und verbessere." },
        { "id": "in-tippen", "gruppe": "auftrag", "kuerzel": "tippen", "text": "Tippe den Text ab. Achte auf die Rechtschreibung." },
        { "id": "in-zeichenformat", "gruppe": "auftrag", "kuerzel": "format", "text": "Probiere die Zeichenformate im Pinsel aus." },
        { "id": "in-hilfe", "gruppe": "auftrag", "kuerzel": "hilfe", "text": "Frage zuerst die Person neben dir. Dann frage mich." },
        { "id": "in-ipad-ablegen", "gruppe": "auftrag", "kuerzel": "ablegen", "text": "Schließe alle Apps. Lege das iPad ab." },
        { "id": "in-f-weiter", "gruppe": "fertig", "kuerzel": "fweiter", "text": "Gestalte deinen Text weiter. Probiere neue Zeichenformate aus." },
        { "id": "in-ha-paket", "gruppe": "ha", "kuerzel": "hapaket", "luecken": [{ "name": "L", "hinweis": "Lernpaket", "quelle": "werk" }], "text": "Beende das Lernpaket {L}." }
      ],
      "stundentypen": [
        { "id": "in-einfuehrung", "name": "Einführung am iPad", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 15 }, { "typ": "einzel", "min": 30 }], "abschlussMin": 10, "material": ["ipad"], "eigenes": [] },
        { "id": "in-uebung", "name": "Übung am iPad", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 5 }, { "typ": "einzel", "min": 30 }, { "typ": "einzel", "min": 15 }], "abschlussMin": 10, "material": ["ipad"], "eigenes": [] },
        { "id": "in-projekt", "name": "Projektarbeit", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 10 }, { "typ": "partner", "min": 40 }], "abschlussMin": 10, "material": ["ipad", "heft"], "eigenes": [] },
        { "id": "in-rueckgabe", "name": "Rückgabe einer Arbeit", "einstieg": 5, "phasen": [{ "typ": "plenum", "min": 15 }, { "typ": "einzel", "min": 25 }], "abschlussMin": 10, "material": ["ipad"], "eigenes": [] }
      ]
    }
  }
};
