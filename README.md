# REPLOG – Trainings-App Prototyp

Ein mobiler Frontend-Prototyp, inspiriert von modernen Gym-Trackern, aber eigenständig aufgebaut.

## Enthalten
- Trainingseinheiten mit eigener Farbe
- Übungen pro Einheit mit Sätzen, Gewicht, Wiederholungen und Pausenzeit
- Aktives Training mit Satz-Checkoff
- Swipe links/rechts zwischen Übungen
- Trainingsdauer + automatischer Pausentimer
- Kalender: 1 Einheit = voller Kreis, 2 = halb/halb, 3+ = aufgeteilte Segmente
- Rest Days mit grauer Markierung
- Tagesdetails im Kalender
- Verlauf aller gespeicherten Trainings
- Übungsbibliothek und eigene Übungen
- LocalStorage-Persistenz
- Responsive Mobile UI

## Start
`index.html` direkt im Browser öffnen. Für PWA-Verhalten besser über einen lokalen Webserver ausliefern, z.B. `python -m http.server` im Projektordner.

## Hinweis
Dies ist ein Frontend-Prototyp ohne Login/Cloud-Backend. Daten werden lokal im Browser gespeichert.
