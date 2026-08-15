# FORM — Training Tracker (Prototyp)

Ein klickbarer MVP als mobile-first Web-App.

## Starten

Einfach `index.html` im Browser öffnen. Alternativ lokal mit einem kleinen Server:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Enthalten

- Dashboard mit Wochenmetriken
- Trainingspläne (inkl. eigener Pläne)
- Aktives Training mit Satz-Logging
- Anzeige der letzten Satzwerte
- Pausentimer
- Eigene Übungen
- Trainingshistorie und einfache Statistiken
- lokale Speicherung via `localStorage`
- Dark/Light Mode

## Sinnvolle nächste Schritte für eine echte App

1. React Native / Expo oder Flutter als mobile Basis
2. Supabase/Postgres für Login, Sync und Backups
3. echte PR- und e1RM-Auswertung aus allen Satzdaten
4. Satz-/Wiederholungsziele pro Übung und Plan
5. Progressionslogik mit RIR/RPE
6. Apple Health / Health Connect
7. Offline-Sync, Export und Datenschutzkonzept
