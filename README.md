# Zettelspiel

Eine komplett statische, mobile-first Web-App für das klassische Zettelspiel.

## Spielablauf
1. Rundenzeit und Begriffe pro Person festlegen.
2. Alle Spielernamen eingeben.
3. Teams entweder zufällig auslosen oder manuell per Drag & Drop zusammenstellen.
4. Das Handy wird herumgereicht und jede Person gibt ihre Begriffe geheim ein.
5. Drei Runden mit denselben Begriffen spielen:
   - Erklären
   - Ein Wort
   - Pantomime
6. Punkte, Teamwechsel und die Reihenfolge der erklärenden Spieler werden automatisch verwaltet.

Die Teams heißen bewusst fest **Team 1** und **Team 2**. Bei der manuellen Einteilung funktioniert Drag & Drop mit Maus, Touch und Apple Pencil; per Tastatur können Spieler mit Enter bzw. Leertaste ins andere Team verschoben werden.

## Technik
- Nur statische Dateien
- Kein Backend, kein Login, keine externen Abhängigkeiten
- Spielstand wird lokal im Browser gespeichert (`localStorage`)
- Mobile-first und für GitHub Pages geeignet
- Ein Reload während eines laufenden Timers setzt sicher vor diesem Zug wieder an

## GitHub Pages
Unter **Settings → Pages** die Veröffentlichung aus dem `main`-Branch aktivieren. Danach läuft das Spiel direkt als statische Website.
