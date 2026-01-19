# Zeitzone und lokale Zeit in der Zeiterfassungs-App

## ✅ Lokale Zeit des Endgeräts wird verwendet

Die App verwendet jetzt **automatisch die lokale Zeit des Tablets/Endgeräts**, nicht die Server-Zeit!

## Wie es funktioniert

### Frontend (Tablet)
1. Mitarbeiter drückt einen Zeit-Button (z.B. "Arbeitsbeginn")
2. Das Frontend erfasst die **lokale Zeit des Geräts**:
   - Datum: `YYYY-MM-DD` (z.B. 2024-01-15)
   - Uhrzeit: `HH:MM:SS` (z.B. 14:30:45)
3. Diese lokale Zeit wird an das Backend gesendet

### Backend (Server)
1. Empfängt die lokale Zeit vom Frontend
2. Speichert diese Zeit direkt in der Datenbank
3. CSV-Export verwendet diese gespeicherte Zeit

## Beispiel

**Szenario:**
- Tablet-Zeit: 15:30:00 (15:30 Uhr)
- Server-Zeit: 13:30:00 UTC

**Ergebnis:**
- Gespeicherte Zeit: 15:30:00 ✅ (Tablet-Zeit)
- CSV zeigt: 15:30:00 ✅ (korrekte lokale Zeit)

## Vorteile

✅ **Korrekte Zeiterfassung** unabhängig von der Server-Zeitzone
✅ **Mitarbeiter sehen die Zeit**, die sie auch auf ihrem Gerät sehen
✅ **Keine Zeitzonenprobleme** bei Tablets in verschiedenen Regionen
✅ **CSV-Export** zeigt die tatsächlich erfasste Zeit

## Technische Details

### Frontend-Code:
```javascript
const now = new Date();
const datum = now.toLocaleDateString('sv-SE'); // YYYY-MM-DD
const uhrzeit = now.toLocaleTimeString('de-DE', { 
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit', 
  hour12: false 
}); // HH:MM:SS
```

### Backend-Code:
```python
# Verwendet die vom Frontend gesendete Zeit
datum = entry.datum  # z.B. "2024-01-15"
uhrzeit = entry.uhrzeit  # z.B. "15:30:45"
```

## Abwärtskompatibilität

Falls ein älteres Frontend keine Zeit sendet, verwendet das Backend automatisch die Server-Zeit als Fallback.

## Wichtig für CSV-Export

Der CSV-Export verwendet das Format:
```
Button-Art,Uhrzeit,Datum,Personalnummer
AAB,15:30:45,15.01.2024,123
```

Die Uhrzeit stammt direkt vom Tablet und ist immer die lokale Zeit des Geräts! ✅
