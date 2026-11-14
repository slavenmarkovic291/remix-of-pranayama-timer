# Asana-Bibliothek für PRANA-XP

## Ziel
Eine praxisorientierte Bibliothek mit **84 belegten Asanas**, verständlichen Ausführungsanleitungen, erleichterten Variationen und passenden originalen GIF-Animationen. Historisch belegte und moderne Formen werden klar unterschieden; die Sammlung wird nicht als eine universell gültige historische Liste bezeichnet.

Der bestehende Timer und die Pranayama-Bibliothek bleiben unverändert.

## 1. Auswahl und verlässliche Inhalte
- Eine konkrete Auswahl von 84 Haltungen zusammenstellen, nach Sitzhaltungen, Standhaltungen, Vorbeugen, Rückbeugen, Drehungen, Gleichgewicht, Umkehrhaltungen und Ruhehaltungen gruppiert.
- Jede Ausführung anhand mehrerer unabhängiger Quellen prüfen; historische Herkunft und heutige Ausführung getrennt dokumentieren. Quellen mit Links direkt auf der jeweiligen Seite anzeigen.
- Jede Anleitung beschreibt Ausgangsposition, schrittweisen Einstieg, Ausrichtung, ruhige Atmung, Halten und kontrolliertes Verlassen.
- Je nach Haltung sinnvolle erleichterte Varianten anbieten, etwa mit Stuhl, Wand, Blöcken, Gurt oder Decke. Keine künstlichen Varianten nur zum Auffüllen erzeugen.
- Voraussetzungen, häufige Fehler und Vorsichtshinweise ergänzen. Anspruchsvolle Umkehrhaltungen und extreme Bewegungen als Praxis mit qualifizierter Anleitung kennzeichnen; keine Heilversprechen oder pauschalen Sicherheitsgarantien.

## 2. Originale GIF-Animationen
- Einen zusammenhängenden Stil mit gut sichtbarem Körper, Gelenkstellungen und Hilfsmitteln verwenden; keine Grafiken oder Animationen aus anderen Apps übernehmen.
- Jede Animation zeigt Einstieg, Haltung und Ausstieg entsprechend der zugehörigen Anleitung. Bei Bedarf unterschiedliche Blickwinkel verwenden.
- Hauptform und jede angebotene Variante erhalten ihre eigene Darstellung; die Variantenwahl tauscht Animation und Anleitung gemeinsam aus.
- Bewegungsablauf, Körperproportionen, Gelenkstellungen und Textübereinstimmung prüfen. Fehlerhafte oder ungeprüfte Animationen werden nicht als korrekte Anleitung veröffentlicht.
- Wiederholung sowie Pause/Fortsetzen anbieten und reduzierte Bewegung berücksichtigen.
- Die Produktion erfolgt in überschaubaren Gruppen: zuerst eine vollständige Musterhaltung mit Varianten, anschließend die übrigen Gruppen. Bis alle 84 Inhalte und Animationen geprüft sind, bleibt der Gesamtauftrag offen.

## 3. Übersicht und Detailseiten
- Neuer Header-Eintrag **Asanas** im bestehenden PRANA-XP-Design.
- Übersicht mit Suche, Kategorien, Schwierigkeitsgrad und Empfehlungsfiltern.
- Gewünschte Bereiche: **Frauen**, **Männer**, **Jüngere**, **Ältere**. Empfehlungen werden pro Haltung begründet; Geschlecht oder Alter allein machen keine Haltung geeignet oder ungeeignet. Individuelle Beweglichkeit, Beschwerden und Voraussetzungen bleiben maßgeblich. Schwangerschaft wird nicht mit „für Frauen“ gleichgesetzt.
- Detailseite mit visueller Ausführung, Variantenwahl, Anleitung, Hilfsmitteln, Vorsicht und Quellen.
- Gute Lesbarkeit und bedienbare Auswahl auf Telefonen und großen Bildschirmen.

## 4. Zusammengesetzte Praktiken
- Eigene Sequenzseiten für **Surya Namaskar**, **Chandra Namaskar** und weitere recherchierte Folgen.
- Die konkrete Schule beziehungsweise Variante nennen, da auch diese Sequenzen nicht überall identisch sind.
- Reihenfolge, Seitenwechsel, Übergänge und Atemzuordnung beschreiben; jede Station verlinkt ihre Asana und passende Erleichterung.
- Varianten bleiben als vollständige, zusammenpassende Abfolge auswählbar.

## Technische Umsetzung
- Browser-sichere, typisierte Inhaltsmodule für Asanas, Varianten, Quellen und Sequenzen; jede Variante verbindet ihre Anleitung eindeutig mit ihrer GIF-Datei.
- Neue Seiten unter `/asanas`, `/asanas/$id`, `/asana-sequences` und `/asana-sequences/$id`; der Header verweist erst auf existierende Seiten.
- Vorhandene Oberflächenbausteine und die auf `.prana-app` begrenzten Gestaltungsvorgaben wiederverwenden.
- Originale Medien über die bestehende Medienablage einbinden; keine neuen Cloud-Dienste oder externen Laufzeit-APIs einführen.
- Eigene Seitentitel und Beschreibungen für alle neuen Inhaltsseiten.

## Prüfung und Abschluss
- Automatische Tests für genau 84 eindeutige Einträge, gültige Varianten-/Medienzuordnung, Empfehlungsfilter und vollständige Sequenzreferenzen.
- Bestehende Timer- und Navigationsprüfungen ausführen.
- Suche → Asana → Variantenwechsel sowie Sequenz → Asana auf Desktop und Telefon im Browser prüfen.
- Animationen einzeln visuell kontrollieren; Quellenprüfung und fachliche Grenzen nachvollziehbar ausweisen.
- Aufgabenliste aktualisieren und nur tatsächlich fertige, geprüfte Teile abhaken. Eine unabhängige fachliche Begutachtung ist nicht durch automatische Tests ersetzt.
