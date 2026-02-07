# Update-Anleitung für Self-Hosted Zeiterfassungs-App

Diese Anleitung zeigt, wie Sie Updates von Emergent auf Ihren eigenen Server deployen **ohne Datenverlust**.

## 🔒 Wichtig: Datenbank-Daten bleiben erhalten!

**Gute Nachricht:** Ihre MongoDB-Daten bleiben bei Updates **automatisch erhalten**!

### Warum?

Docker verwendet **Volumes** für persistente Daten:
```yaml
volumes:
  - mongodb_data:/data/db
```

Dieses Volume bleibt bestehen, auch wenn Container neu gebaut oder aktualisiert werden.

---

## 📋 Update-Prozess Übersicht

```
Emergent → GitHub → Ihr Server → Docker neu bauen → App läuft mit neuen Code + alten Daten ✅
```

---

## 🔄 Schritt-für-Schritt Update-Anleitung

### Schritt 1: Änderungen in Emergent entwickeln

Entwickeln Sie neue Features oder Bugfixes in Emergent wie gewohnt.

### Schritt 2: Code zu GitHub pushen

**In Emergent:**
1. Chat öffnen
2. "Save to GitHub" Button klicken
3. Repository auswählen
4. Commit-Nachricht eingeben (z.B. "Feature: Offline-Modus hinzugefügt")
5. Push bestätigen

**Oder manuell:**
```bash
# Falls Sie lokal entwickeln
git add .
git commit -m "Update: Neue Features hinzugefügt"
git push origin main
```

### Schritt 3: Backup der Datenbank erstellen (WICHTIG!)

**Auf Ihrem Server:**

```bash
# SSH-Verbindung zum Server
ssh deploy@IHRE_SERVER_IP

# Zum Projekt-Verzeichnis
cd ~/zeiterfassung-app

# Backup erstellen (vor jedem Update!)
docker exec zeiterfassung-mongodb mongodump \
  --db zeiterfassung_production \
  --out /data/backup/pre-update-$(date +%Y%m%d_%H%M%S)

# Backup vom Container kopieren (optional, für extra Sicherheit)
docker cp zeiterfassung-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

### Schritt 4: Code vom GitHub Repository pullen

```bash
# Im Projekt-Verzeichnis
cd ~/zeiterfassung-app

# Aktuellen Status prüfen
git status

# Neueste Änderungen holen
git pull origin main
```

**Ausgabe sollte zeigen:**
```
Updating abc1234..def5678
Fast-forward
 frontend/src/App.js | 25 ++++++++++++++++++++++---
 backend/server.py   | 15 ++++++++++++++-
 2 files changed, 36 insertions(+), 4 deletions(-)
```

### Schritt 5: Welche Dateien müssen geändert werden?

**Automatisch aktualisiert (durch git pull):**
- ✅ Alle Code-Dateien
- ✅ `frontend/src/*`
- ✅ `backend/*.py`
- ✅ `package.json`, `requirements.txt`

**Manuell prüfen (falls geändert):**
- ⚠️ `backend/.env` - **NUR wenn neue Variablen hinzugekommen sind**
- ⚠️ `frontend/.env` - **NUR wenn neue Variablen hinzugekommen sind**
- ⚠️ `docker-compose.yml` - **NUR wenn Services geändert wurden**

**NICHT ändern (bleiben wie sie sind):**
- ❌ Ihre Produktions-URLs in `.env`
- ❌ MongoDB Connection Strings
- ❌ SMTP-Einstellungen (werden in DB gespeichert)

### Schritt 6: Neue Dependencies installieren (falls nötig)

**Prüfen Sie, ob neue Python-Packages hinzugefügt wurden:**
```bash
# Zeige Änderungen in requirements.txt
git diff HEAD~1 backend/requirements.txt
```

**Prüfen Sie, ob neue Node-Packages hinzugefügt wurden:**
```bash
# Zeige Änderungen in package.json
git diff HEAD~1 frontend/package.json
```

Falls Änderungen vorhanden → Container werden automatisch neu gebaut (nächster Schritt).

### Schritt 7: Container neu bauen und starten

```bash
# Container stoppen (Daten bleiben erhalten!)
docker compose down

# Container neu bauen mit neuem Code
docker compose up -d --build

# Logs überwachen
docker compose logs -f
```

**Was passiert dabei:**
1. ✅ Container werden gestoppt
2. ✅ Neuer Code wird in Container kopiert
3. ✅ Dependencies werden installiert
4. ✅ Container starten mit neuem Code
5. ✅ **MongoDB-Volume bleibt unverändert** → Daten erhalten!

### Schritt 8: App testen

```bash
# Container-Status prüfen
docker compose ps

# Alle Container sollten "Up" sein
```

**Browser-Test:**
1. App öffnen: `https://zeiterfassung.ihre-domain.de`
2. Login testen
3. Neue Features testen
4. Alte Daten prüfen (Mitarbeiter sollten noch da sein!)

### Schritt 9: Logs prüfen auf Fehler

```bash
# Backend-Logs
docker compose logs backend --tail=50

# Frontend-Logs
docker compose logs frontend --tail=50

# Auf Fehler achten
docker compose logs | grep -i error
```

---

## 🗂️ Welche Dateien werden bei Updates geändert?

### **Immer aktualisiert (durch git pull):**

```
✅ /frontend/src/App.js
✅ /frontend/src/index.js
✅ /frontend/src/App.css
✅ /backend/server.py
✅ /backend/requirements.txt
✅ /frontend/package.json
✅ README.md, Dokumentation
```

### **Bedingt aktualisiert (prüfen Sie manuell):**

**`backend/.env`:**
```bash
# Neue Zeilen hinzufügen, wenn im Update erwähnt
# z.B. neue Feature-Flags oder API-Keys

# Beispiel: Neues Feature für Offline-Mode
ENABLE_OFFLINE_MODE=true
```

**`frontend/.env`:**
```bash
# Nur bei neuen Frontend-Features
# z.B. neue API-Endpoints
REACT_APP_ENABLE_OFFLINE=true
```

**`docker-compose.yml`:**
```bash
# Nur bei Infrastruktur-Änderungen
# z.B. neue Services, geänderte Ports
# SELTEN nötig
```

### **NIEMALS ändern:**

```
❌ MONGO_URL (Ihre Produktions-DB)
❌ FRONTEND_URL (Ihre Domain)
❌ CORS_ORIGINS (Ihre Domain)
❌ SSL-Zertifikate
❌ Nginx-Konfiguration (außer Update nötig)
```

---

## 💾 Daten bleiben erhalten - So funktioniert's

### Docker Volumes erklärt

**In docker-compose.yml:**
```yaml
services:
  mongodb:
    volumes:
      - mongodb_data:/data/db  # ← Hier!

volumes:
  mongodb_data:  # ← Persistent Volume
```

**Was bedeutet das?**
- `mongodb_data` ist ein **benanntes Volume**
- Docker speichert es **außerhalb** des Containers
- Bleibt bestehen bei:
  - ✅ Container-Neustart
  - ✅ Container-Rebuild
  - ✅ Code-Updates
  - ✅ `docker compose down`

**Nur gelöscht bei:**
- ❌ `docker compose down -v` (mit -v Flag!)
- ❌ `docker volume rm mongodb_data`
- ❌ **Niemals versehentlich ausführen!**

### Volume-Speicherort prüfen

```bash
# Alle Volumes anzeigen
docker volume ls

# Volume-Details
docker volume inspect zeiterfassung-app_mongodb_data

# Zeigt Speicherort, z.B.:
# /var/lib/docker/volumes/zeiterfassung-app_mongodb_data/_data
```

### Daten manuell prüfen

```bash
# In MongoDB-Container einloggen
docker exec -it zeiterfassung-mongodb mongosh

# Datenbank auswählen
use zeiterfassung_production

# Mitarbeiter zählen
db.employees.countDocuments()

# Zeiteinträge zählen
db.time_entries.countDocuments()

# Verlassen
exit
```

---

## 🆘 Rollback bei Problemen

Falls ein Update Probleme verursacht:

### Option A: Vorherige Git-Version

```bash
# Letzte funktionierende Version anzeigen
git log --oneline

# Zu vorheriger Version zurück
git checkout COMMIT_HASH

# Container neu bauen
docker compose down
docker compose up -d --build
```

### Option B: Datenbank wiederherstellen

```bash
# Backup-Liste anzeigen
docker exec zeiterfassung-mongodb ls -la /data/backup/

# Backup wiederherstellen
docker exec zeiterfassung-mongodb mongorestore \
  --db zeiterfassung_production \
  --drop \
  /data/backup/pre-update-DATUM
```

### Option C: Komplettes Rollback

```bash
# Code zurücksetzen
git reset --hard HEAD~1

# Container neu bauen
docker compose down
docker compose up -d --build

# Falls Datenbank auch betroffen:
# Backup wiederherstellen (siehe Option B)
```

---

## 📝 Update-Checkliste

Verwenden Sie diese Checkliste bei jedem Update:

```
□ 1. Backup der Datenbank erstellen
□ 2. git pull origin main
□ 3. .env Dateien auf neue Variablen prüfen
□ 4. docker-compose.yml prüfen (falls geändert)
□ 5. docker compose down
□ 6. docker compose up -d --build
□ 7. Logs prüfen (docker compose logs -f)
□ 8. Container-Status prüfen (docker compose ps)
□ 9. App im Browser testen
□ 10. Login testen (User + Admin)
□ 11. Neue Features testen
□ 12. Alte Daten prüfen (Mitarbeiter vorhanden?)
□ 13. 24h beobachten auf Fehler
```

---

## 🔄 Automatisiertes Update-Script (Optional)

Erstellen Sie ein Script für einfachere Updates:

```bash
nano ~/update-zeiterfassung.sh
```

**Inhalt:**
```bash
#!/bin/bash
set -e  # Bei Fehler abbrechen

echo "🔄 Zeiterfassung-App Update-Script"
echo "=================================="

# Variablen
APP_DIR=~/zeiterfassung-app
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

cd $APP_DIR

# 1. Backup erstellen
echo "📦 Erstelle Backup..."
mkdir -p $BACKUP_DIR
docker exec zeiterfassung-mongodb mongodump \
  --db zeiterfassung_production \
  --out /data/backup/pre-update-$DATE
docker cp zeiterfassung-mongodb:/data/backup/pre-update-$DATE $BACKUP_DIR/
echo "✅ Backup erstellt: $BACKUP_DIR/pre-update-$DATE"

# 2. Code aktualisieren
echo "📥 Hole Updates von GitHub..."
git pull origin main

# 3. Container neu bauen
echo "🔨 Baue Container neu..."
docker compose down
docker compose up -d --build

# 4. Warten und Logs prüfen
echo "⏳ Warte 10 Sekunden..."
sleep 10

# 5. Status prüfen
echo "🔍 Prüfe Container-Status..."
docker compose ps

# 6. Logs anzeigen
echo "📋 Letzte Log-Einträge:"
docker compose logs --tail=20

echo ""
echo "✅ Update abgeschlossen!"
echo "🌐 Bitte testen Sie die App im Browser"
echo "📊 Logs: docker compose logs -f"
```

**Ausführbar machen:**
```bash
chmod +x ~/update-zeiterfassung.sh
```

**Verwenden:**
```bash
~/update-zeiterfassung.sh
```

---

## 🎯 Wichtige Punkte zusammengefasst

### ✅ Was Sie wissen müssen:

1. **Datenbank-Daten gehen NICHT verloren** bei Updates
2. **Docker Volumes** sind persistent
3. **Nur Code** wird aktualisiert, nicht die Daten
4. **.env Dateien** bleiben meist unverändert
5. **Backup vor Update** ist Best Practice

### ⚠️ Vorsicht bei:

1. `docker compose down -v` ← **-v löscht Volumes!**
2. `docker volume rm` ← Löscht Daten permanent
3. Manuelle Änderungen in `.env` überschreiben

### 🚀 Update-Workflow in Kurzform:

```bash
# 1. Backup
docker exec zeiterfassung-mongodb mongodump --db zeiterfassung_production --out /data/backup/backup-$(date +%Y%m%d)

# 2. Code pullen
git pull origin main

# 3. Neu bauen
docker compose down && docker compose up -d --build

# 4. Testen
docker compose ps
docker compose logs -f
```

---

## 📞 Support bei Update-Problemen

Falls etwas schief geht:

1. **Logs prüfen:** `docker compose logs`
2. **Container-Status:** `docker compose ps`
3. **Rollback:** Vorherige Git-Version
4. **Backup wiederherstellen:** mongorestore
5. **Emergent-Support kontaktieren** (falls auf Emergent gehostet)

---

## 🎓 Best Practices

### Vor jedem Update:
- ✅ Backup der Datenbank erstellen
- ✅ Update-Notizen von Emergent lesen
- ✅ In Wartungsfenster durchführen (nachts/Wochenende)

### Nach jedem Update:
- ✅ Alle Features testen
- ✅ Logs 24h überwachen
- ✅ Benutzer-Feedback sammeln

### Regelmäßig:
- ✅ Alte Backups löschen (>30 Tage)
- ✅ System-Updates durchführen
- ✅ Docker-Images aktualisieren

---

**Sie können beruhigt Updates durchführen - Ihre Daten sind sicher!** 🔒✅
