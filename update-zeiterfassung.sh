#!/bin/bash
set -e  # Bei Fehler abbrechen

echo "🔄 Zeiterfassung-App Update-Script"
echo "=================================="
echo ""

# Variablen
APP_DIR=~/zeiterfassung-app
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Prüfe ob wir im richtigen Verzeichnis sind
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Fehler: docker-compose.yml nicht gefunden!"
    echo "Bitte führen Sie das Script aus dem App-Verzeichnis aus:"
    echo "cd ~/zeiterfassung-app && bash update-zeiterfassung.sh"
    exit 1
fi

# 1. Backup erstellen
echo "📦 Erstelle Backup der Datenbank..."
mkdir -p $BACKUP_DIR

if docker ps | grep -q zeiterfassung-mongodb; then
    docker exec zeiterfassung-mongodb mongodump \
      --db zeiterfassung_production \
      --out /data/backup/pre-update-$DATE
    
    docker cp zeiterfassung-mongodb:/data/backup/pre-update-$DATE $BACKUP_DIR/
    echo "✅ Backup erstellt: $BACKUP_DIR/pre-update-$DATE"
else
    echo "⚠️  MongoDB-Container läuft nicht, überspringe Backup"
fi

echo ""

# 2. Code aktualisieren
echo "📥 Hole Updates von GitHub..."
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL = $REMOTE ]; then
    echo "ℹ️  Keine neuen Updates verfügbar"
    read -p "Möchten Sie trotzdem die Container neu bauen? (j/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        echo "Abgebrochen."
        exit 0
    fi
else
    echo "✅ Neue Updates gefunden, wird heruntergeladen..."
    git pull origin main
fi

echo ""

# 3. Container neu bauen
echo "🔨 Baue Container neu..."
echo "   (Dies kann einige Minuten dauern...)"
docker compose down
docker compose up -d --build

echo ""

# 4. Warten und Logs prüfen
echo "⏳ Warte 15 Sekunden auf Start..."
sleep 15

echo ""

# 5. Status prüfen
echo "🔍 Prüfe Container-Status..."
docker compose ps

echo ""

# 6. Logs anzeigen
echo "📋 Letzte Backend-Log-Einträge:"
docker compose logs backend --tail=10

echo ""
echo "📋 Letzte Frontend-Log-Einträge:"
docker compose logs frontend --tail=10

echo ""
echo "=================================="
echo "✅ Update abgeschlossen!"
echo ""
echo "🌐 Bitte testen Sie die App im Browser:"
echo "   https://zeiterfassung.ihre-domain.de"
echo ""
echo "📊 Alle Logs anzeigen:"
echo "   docker compose logs -f"
echo ""
echo "🔄 Container neu starten (falls nötig):"
echo "   docker compose restart"
echo ""
echo "📦 Backup-Speicherort:"
echo "   $BACKUP_DIR/pre-update-$DATE"
echo "=================================="
