# Remix of Pranayama Timer

Erstelle eine Multi-Timer Web-App mit sequenzieller Kette und folgenden Funktionen:

1. Bis zu 50 Timer hintereinander schalten:
   - Jeder Timer in der Kette hat eine individuell einstellbare Zeit und optional einen Namen/Titel.
   - Timer können hinzugefügt, gelöscht, dupliziert und in der Reihenfolge sortiert/verschoben werden.

2. Automatischer Ablauf mit 1-Klick-Start:
   - Ein einziger Start-Button startet die Kette.
   - Sobald ein Timer von seiner Zeit auf 0 abläuft, startet der nächste Timer in der Reihe automatisch ohne Unterbrechung.
   - Während des Laufs: Pause/Fortsetzen, Vorwärts- und Rückwärtsspringen (Skip) sowie Reset der gesamten Kette oder des aktuellen Timers.

3. Signal bei Ablauf (Übergang auf 0):
   - Wählbar pro Kette oder global: Signalton (Audio-Beep), Vibration (Web Vibration API) oder komplett stumm.

4. Flexible Zeiteinheiten (Standard nur Sekunden):
   - Schieberegler / Toggles für Stunden, Minuten, Sekunden und Millisekunden.
   - Standardmäßig sind nur Sekunden aktiv.
   - Die Eingabefelder und die Anzeige passen sich dynamisch den aktivierten Einheiten an (wenn nur Sekunden aktiv sind, gibt es nur ein schnelles Eingabefeld für Sekunden).

5. Große, anpassbare Ziffernanzeige:
   - Schieberegler zum Anpassen der Schriftgröße der Zeitanzeige, damit der Countdown auch aus der Ferne gut lesbar ist.
   - Große Anzeige des aktuellen Timers inklusive Fortschrittsbalken und Vorschau auf den als Nächstes folgenden Timer.

6. Vorlagen (Presets):
   - Timer-Ketten können gespeichert, umbenannt und wieder geladen werden (lokal gespeichert).

7. Mobile-Optimierung & PWA:
   - Responsive, saubere Oberfläche mit Dark/Light Mode, optimiert für Touch und Nutzung auf Android-Smartphones (installierbar als PWA).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c677f669-622d-475f-aca4-a92faac140c8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
