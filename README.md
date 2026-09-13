# Zettelspiel

Eine komplett statische, mobile-first Web-App für das klassische Zettelspiel.

## Spielablauf
1. Rundenzeit und Begriffe pro Person festlegen.
2. Alle Spielernamen eingeben.
3. Teams entweder zufällig auslosen oder manuell zusammenstellen.
4. Das Handy wird herumgereicht und jede Person gibt ihre Begriffe geheim ein.
5. Drei Runden mit denselben Begriffen spielen:
   - Erklären
   - Ein Wort
   - Pantomime
6. Punkte, Teamwechsel und die Reihenfolge der erklärenden Spieler werden automatisch verwaltet.

## Technik
- Nur statische Dateien
- Kein Backend, kein Login, keine externen Abhängigkeiten
- Spielstand wird lokal im Browser gespeichert (`localStorage`)
- Geeignet für GitHub Pages

## GitHub Pages
Unter **Settings → Pages** die Veröffentlichung aus dem `main`-Branch aktivieren. Danach läuft das Spiel direkt als statische Website.
