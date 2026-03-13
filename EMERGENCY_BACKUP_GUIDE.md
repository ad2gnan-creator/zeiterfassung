# Notfall-Backup-Anleitung für Emergent-Hosted App

## ⚠️ WICHTIG: Datensicherung vor möglicher Deaktivierung

Diese Anleitung hilft Ihnen, Ihre Daten zu sichern, BEVOR die App deaktiviert wird.

---

## 📦 Option 1: Manuelles Backup über Admin-Interface

### Schritt 1: CSV-Export aller Zeiteinträge

1. **Als Administrator einloggen**
2. **Einstellungen öffnen**
3. **"CSV-Datei herunterladen" klicken**
4. **Datei sicher speichern** (z.B. auf lokalem PC + Cloud)

**Wiederholen Sie dies:**
- ✅ Mindestens 1x pro Woche
- ✅ Vor jedem erwarteten Credit-Ablauf
- ✅ Nach wichtigen Arbeitsperioden

### Schritt 2: Mitarbeiter-Liste exportieren

**Aktuell nicht direkt möglich, aber:**

**Workaround - Browser Developer Tools:**
```javascript
// Im Browser auf der Verwaltungs-Seite:
// 1. F12 drücken (Developer Console öffnen)
// 2. Console-Tab öffnen
// 3. Folgenden Code einfügen und Enter drücken:

// Hole alle Mitarbeiter-Daten
const employees = []; // Wird mit Daten gefüllt
const rows = document.querySelectorAll('.employee-row'); // Anpassen falls nötig

rows.forEach(row => {
  // Extrahiere Daten aus UI
  console.log(row.textContent);
});

// Alternative: API direkt aufrufen
fetch('https://ihre-app.emergentagent.com/api/employees')
  .then(r => r.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
    // Kopieren und als JSON-Datei speichern
  });
```

---

## 💾 Option 2: Datenbank-Zugriff (falls möglich)

### Prüfen Sie, ob Sie MongoDB-Zugriff haben:

**Wenn Emergent SSH-Zugriff bietet:**
```bash
# Verbinden (falls möglich)
ssh user@ihre-app.emergentagent.com

# MongoDB-Backup
mongodump --db zeiterfassung_production --out /tmp/backup

# Backup herunterladen
scp -r /tmp/backup lokaler-pfad/
```

**Wahrscheinlich NICHT verfügbar** bei Emergent Managed Hosting.

---

## 📤 Option 3: Backup-Feature implementieren (EMPFOHLEN)

### Admin-Backup-Funktion hinzufügen

Ich erstelle eine Export-Funktion, die alle Daten als JSON herunterlädt.

**Vorteile:**
- ✅ Ein Klick = Komplettes Backup
- ✅ Alle Mitarbeiter + alle Zeiteinträge
- ✅ JSON-Format (leicht importierbar)
- ✅ Keine technischen Kenntnisse nötig

**Soll ich diese Funktion jetzt implementieren?** (Siehe nächster Abschnitt)

---

## 🔄 Option 4: Code + Daten zu GitHub/eigenem Server

### A) Code sichern (SOFORT!)

```
1. In Emergent: "Save to GitHub" klicken
2. Repository erstellen/auswählen
3. Code wird gesichert
```

**Status:** ✅ Code ist sicher, kann jederzeit neu deployed werden

### B) Daten sichern (KRITISCH!)

**Problem:** Daten sind NUR auf Emergent-MongoDB
**Risiko:** Bei Deaktivierung möglicherweise nicht zugänglich

**Lösung:** Regelmäßige Exports (siehe Option 1 + 3)

---

## 🚀 EMPFOHLENE MASSNAHMEN (In Reihenfolge)

### SOFORT (Heute):

```
□ 1. CSV-Backup herunterladen (via Admin-Interface)
□ 2. Screenshot von Mitarbeiter-Liste machen
□ 3. "Save to GitHub" ausführen (Code sichern)
□ 4. Emergent-Support kontaktieren (siehe unten)
□ 5. Credit-Stand prüfen (wie lange reicht es noch?)
```

### DIESE WOCHE:

```
□ 6. Backup-Feature implementieren lassen (siehe Anfrage unten)
□ 7. Wöchentliche Backup-Routine einrichten
□ 8. Antwort vom Emergent-Support abwarten
```

### LANGFRISTIG:

```
□ 9. Auto-Top-Up einrichten (falls verfügbar)
□ 10. Self-Hosting als Backup-Plan vorbereiten
□ 11. Dokumentierte Backup-Prozedur erstellen
```

---

## 📧 Support-Anfrage Template

**An:** support@emergent.sh  
**Betreff:** DRINGEND - Datenaufbewahrung bei App-Deaktivierung  

```
Sehr geehrtes Emergent-Team,

ich betreibe eine produktive Zeiterfassungs-App (deployed) mit 
MongoDB-Datenbank auf der Emergent-Plattform.

KRITISCHE FRAGEN zur Datensicherheit:

1. DATENAUFBEWAHRUNG:
   - Bleiben MongoDB-Daten erhalten, wenn meine App wegen 
     fehlender Credits automatisch deaktiviert wird?
   - Wenn JA: Wie lange werden sie aufbewahrt?
   - Wenn NEIN: Wie kann ich Datenverlust verhindern?

2. REAKTIVIERUNG:
   - Sind die Daten nach erneutem Deployment wieder verfügbar?
   - Oder muss ich die Datenbank neu aufsetzen?

3. WARNSYSTEM:
   - Gibt es Warnungen VOR automatischer Deaktivierung?
   - Wie viele Tage/Stunden Vorlaufzeit?
   - Per E-Mail/Dashboard?

4. BACKUP-MÖGLICHKEITEN:
   - Kann ich direkten MongoDB-Zugriff für Backups bekommen?
   - Gibt es eine Backup/Export-Funktion?
   - Welche Backup-Strategie empfehlen Sie?

5. AUTO-TOP-UP:
   - Gibt es eine Auto-Top-Up-Funktion für Credits?
   - Kann ich Kreditkarte hinterlegen für automatische Aufladung?

KONTEXT:
- App wird produktiv von mehreren Mitarbeitern genutzt
- Täglich werden Zeiteinträge erfasst
- Datenverlust wäre kritisch für Lohnabrechnung
- Aktueller Credit-Stand: [IHRE_CREDITS]
- Job-ID: [IHRE_JOB_ID]

Ich bitte um schnellstmögliche Antwort, da dies kritisch für 
meinen Produktivbetrieb ist.

Mit freundlichen Grüßen,
[Ihr Name]
```

---

## 🛡️ Backup-Strategie - Best Practices

### Backup-Frequenz:

**MINDESTENS:**
- 📅 1x pro Woche: Kompletter Export
- 📅 Nach wichtigen Arbeitsperioden (Monatsende, etc.)
- 📅 VOR vermuteter Credit-Deaktivierung

**IDEAL:**
- 📅 Täglich automatisch (wenn Feature verfügbar)
- 📅 Nach jeder wichtigen Änderung
- 📅 Vor jedem Update/Deployment

### Backup-Speicherorte (3-2-1 Regel):

**3 Kopien:**
1. Auf Emergent (Primär-Daten)
2. Lokaler PC/Laptop
3. Cloud-Storage (Google Drive, Dropbox, OneDrive)

**2 verschiedene Medien:**
- Server (Emergent)
- Lokale Festplatte + Cloud

**1 Off-Site:**
- Cloud-Storage außerhalb Ihres Standorts

---

## 🆘 Notfall-Plan: Was tun bei Deaktivierung?

### Wenn App deaktiviert wird:

**1. RUHE BEWAHREN**
- Daten sind wahrscheinlich noch da (aber nicht sicher!)

**2. SOFORT KONTAKTIEREN:**
```
Emergent-Support mit DRINGEND-Vermerk
Discord: Sofortige Community-Hilfe
```

**3. BACKUP WIEDERHERSTELLEN (falls nötig):**
- Neuestes Backup lokalisieren
- Auf eigenem Server deployen (siehe Self-Hosting-Guide)
- Backup-Daten importieren

**4. ALTERNATIVE AKTIVIEREN:**
```bash
# Auf eigenem Server:
cd ~/zeiterfassung-app
docker compose up -d
# Backup-Daten importieren (siehe nächster Abschnitt)
```

### Daten aus Backup wiederherstellen:

**CSV-Import (manuell):**
- Leider aktuell keine automatische Import-Funktion
- Mitarbeiter müssen neu angelegt werden
- Zeit-Daten aus CSV manuell übertragen

**JSON-Import (wenn Backup-Feature implementiert):**
```javascript
// Im Admin-Interface (wenn Feature vorhanden):
// "Backup wiederherstellen" Button
// JSON-Datei hochladen
// Automatischer Import
```

---

## ⚙️ Backup-Feature-Anfrage

**Soll ich ein komplettes Backup/Restore-Feature implementieren?**

**Das Feature würde enthalten:**

### EXPORT:
- ✅ Ein Button: "Komplettes Backup herunterladen"
- ✅ Exportiert: Alle Mitarbeiter + Alle Zeiteinträge + Einstellungen
- ✅ Format: JSON (leicht lesbar und importierbar)
- ✅ Dateiname: `zeiterfassung-backup-2024-01-19.json`

### IMPORT/RESTORE:
- ✅ "Backup wiederherstellen" Button
- ✅ JSON-Datei hochladen
- ✅ Optionen:
  - Daten hinzufügen (merge)
  - Daten überschreiben (replace)
- ✅ Validierung vor Import

**Aufwand:** Ca. 2-3 Stunden Entwicklung
**Nutzen:** Komplette Daten-Kontrolle und -Sicherheit

---

## 📊 Aktuelle Situation - Checkliste

```
□ Code ist gesichert (GitHub)?          [JA/NEIN]
□ Letztes CSV-Backup vorhanden?          [DATUM: _______]
□ Mitarbeiter-Liste dokumentiert?        [JA/NEIN]
□ Credit-Stand geprüft?                  [CREDITS: _______]
□ Support kontaktiert?                   [JA/NEIN]
□ Antwort vom Support erhalten?          [JA/NEIN]
□ Backup-Routine eingerichtet?           [JA/NEIN]
□ Self-Hosting als Backup vorbereitet?   [JA/NEIN]
```

---

## 🎯 ZUSAMMENFASSUNG

**KRITISCHES RISIKO:**
- ⚠️ Datenaufbewahrung bei Deaktivierung ist NICHT dokumentiert
- ⚠️ Datenverlust ist möglich (aber nicht bestätigt)
- ⚠️ Produktive Zeiterfassungsdaten sind gefährdet

**SOFORTMASSNAHMEN:**
1. ✅ CSV-Backup JETZT herunterladen
2. ✅ Emergent-Support HEUTE kontaktieren  
3. ✅ Code via GitHub sichern
4. ✅ Wöchentliche Backups einrichten

**MITTELFRISTIG:**
- Backup-Feature implementieren lassen
- Self-Hosting als Backup-Plan
- Auto-Top-Up einrichten (wenn verfügbar)

**LANGFRISTIG:**
- Professionelle Backup-Strategie
- Möglicherweise Migration auf eigenen Server

---

**Ihre Daten sind wertvoll - sichern Sie sie JETZT!** 🔒

Bei Fragen oder für die Implementierung des Backup-Features, 
bitte melden!
