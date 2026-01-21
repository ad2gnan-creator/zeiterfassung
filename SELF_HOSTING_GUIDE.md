# Self-Hosting Anleitung für die Zeiterfassungs-App

Diese Anleitung zeigt Ihnen Schritt für Schritt, wie Sie die Zeiterfassungs-App auf Ihrem eigenen Server hosten können.

## 📋 Inhaltsverzeichnis

1. [Server-Anforderungen](#1-server-anforderungen)
2. [Code von Emergent exportieren](#2-code-von-emergent-exportieren)
3. [Server vorbereiten](#3-server-vorbereiten)
4. [Docker-Setup](#4-docker-setup)
5. [MongoDB einrichten](#5-mongodb-einrichten)
6. [Umgebungsvariablen konfigurieren](#6-umgebungsvariablen-konfigurieren)
7. [App mit Docker Compose deployen](#7-app-mit-docker-compose-deployen)
8. [Nginx als Reverse Proxy](#8-nginx-als-reverse-proxy)
9. [SSL-Zertifikate mit Let's Encrypt](#9-ssl-zertifikate-mit-lets-encrypt)
10. [App starten und testen](#10-app-starten-und-testen)
11. [Wartung und Updates](#11-wartung-und-updates)
12. [Backup-Strategie](#12-backup-strategie)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Server-Anforderungen

### Hardware
- **Minimum:**
  - 2 CPU Cores
  - 2 GB RAM
  - 20 GB SSD Storage
  
- **Empfohlen:**
  - 2-4 CPU Cores
  - 4 GB RAM
  - 40 GB SSD Storage

### Software
- **Betriebssystem:** Ubuntu 22.04 LTS oder neuer
- **Netzwerk:** Öffentliche IP-Adresse
- **Domain:** (optional, aber empfohlen) z.B. zeiterfassung.ihre-domain.de

### Anbieter-Empfehlungen
- **DigitalOcean:** Droplet ab $12/Monat
- **Hetzner:** VPS ab €5/Monat
- **Contabo:** VPS ab €5/Monat
- **AWS/GCP/Azure:** Für größere Deployments

---

## 2. Code von Emergent exportieren

### Option A: GitHub Integration (empfohlen)

1. **GitHub-Account verbinden:**
   - Gehen Sie zu Emergent Dashboard
   - Profil → "Connect GitHub"
   - Autorisieren Sie Emergent

2. **Code speichern:**
   - Im Chat: Klicken Sie auf "Save to GitHub"
   - Wählen Sie Repository-Name (z.B. `zeiterfassung-app`)
   - Der komplette Code wird gepusht

3. **Repository klonen:**
   ```bash
   git clone https://github.com/IHR-USERNAME/zeiterfassung-app.git
   cd zeiterfassung-app
   ```

### Option B: Manueller Download

1. **VS Code View öffnen** in Emergent
2. **Dateien herunterladen:**
   - Alle Dateien aus `/app/backend/`
   - Alle Dateien aus `/app/frontend/`
   - `.env` Dateien
   - `README.md`, `DEPLOYMENT.md`, etc.

3. **Projekt-Struktur erstellen:**
   ```bash
   mkdir zeiterfassung-app
   cd zeiterfassung-app
   mkdir backend frontend
   # Kopieren Sie die heruntergeladenen Dateien
   ```

---

## 3. Server vorbereiten

### Verbindung zum Server herstellen

```bash
ssh root@IHRE_SERVER_IP
```

### System aktualisieren

```bash
apt update && apt upgrade -y
```

### Firewall konfigurieren

```bash
# UFW Firewall installieren und aktivieren
apt install ufw -y

# Ports öffnen
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Firewall aktivieren
ufw enable
ufw status
```

### Benutzer erstellen (optional, aber empfohlen)

```bash
# Neuen Benutzer erstellen
adduser deploy
usermod -aG sudo deploy

# SSH-Zugriff für neuen Benutzer
su - deploy
mkdir ~/.ssh
chmod 700 ~/.ssh

# Ab jetzt als deploy-Benutzer arbeiten
exit
ssh deploy@IHRE_SERVER_IP
```

---

## 4. Docker-Setup

### Docker installieren

```bash
# Docker Installation
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Benutzer zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER

# Neu einloggen, damit Gruppenänderung wirksam wird
exit
ssh deploy@IHRE_SERVER_IP

# Docker-Version prüfen
docker --version
```

### Docker Compose installieren

```bash
# Docker Compose V2 ist bereits in Docker integriert
docker compose version

# Falls nicht verfügbar, manuell installieren:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 5. MongoDB einrichten

### Option A: MongoDB als Docker Container (einfacher)

Wird über Docker Compose automatisch gestartet (siehe Schritt 7).

### Option B: MongoDB Atlas (Cloud, empfohlen für Produktion)

1. **Gehen Sie zu:** https://www.mongodb.com/cloud/atlas
2. **Kostenloses Cluster erstellen** (M0 Tier)
3. **Database Access:**
   - Benutzer erstellen (z.B. `admin`)
   - Passwort notieren
4. **Network Access:**
   - IP-Whitelist: `0.0.0.0/0` (für Test) oder Ihre Server-IP
5. **Connection String kopieren:**
   ```
   mongodb+srv://admin:PASSWORT@cluster0.xxxxx.mongodb.net/zeiterfassung?retryWrites=true&w=majority
   ```

### Option C: MongoDB direkt auf Server

```bash
# MongoDB importieren
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installieren
sudo apt update
sudo apt install -y mongodb-org

# Starten
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

---

## 6. Umgebungsvariablen konfigurieren

### Code auf Server kopieren

```bash
# Projekt-Verzeichnis erstellen
mkdir -p ~/zeiterfassung-app
cd ~/zeiterfassung-app

# Von GitHub klonen (falls noch nicht geschehen)
git clone https://github.com/IHR-USERNAME/zeiterfassung-app.git .

# Oder: Dateien per SCP hochladen
# Auf lokalem Rechner:
scp -r /pfad/zu/zeiterfassung-app deploy@IHRE_SERVER_IP:~/
```

### Backend .env anpassen

```bash
cd ~/zeiterfassung-app
nano backend/.env
```

**Inhalt:**
```env
# MongoDB (wählen Sie eine Option)
# Option A: Lokaler Docker Container
MONGO_URL="mongodb://mongodb:27017"

# Option B: MongoDB Atlas
# MONGO_URL="mongodb+srv://admin:PASSWORT@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"

# Option C: Lokale MongoDB Installation
# MONGO_URL="mongodb://localhost:27017"

# Datenbank-Name
DB_NAME="zeiterfassung_production"

# CORS (setzen Sie Ihre Domain)
CORS_ORIGINS="https://zeiterfassung.ihre-domain.de"

# Frontend URL für Passwort-Reset
FRONTEND_URL="https://zeiterfassung.ihre-domain.de"
```

### Frontend .env anpassen

```bash
nano frontend/.env
```

**Inhalt:**
```env
# Backend API URL (mit /api Prefix)
REACT_APP_BACKEND_URL=https://zeiterfassung.ihre-domain.de

# Port (für Docker)
PORT=3000

# Weitere Optionen
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

---

## 7. App mit Docker Compose deployen

### Docker Compose Datei erstellen

```bash
cd ~/zeiterfassung-app
nano docker-compose.yml
```

**Inhalt:**
```yaml
version: '3.8'

services:
  # MongoDB (optional - nur wenn nicht Atlas verwendet wird)
  mongodb:
    image: mongo:7.0
    container_name: zeiterfassung-mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: zeiterfassung_production
    networks:
      - app-network
    ports:
      - "27017:27017"

  # Backend (FastAPI)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: zeiterfassung-backend
    restart: always
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
    networks:
      - app-network
    ports:
      - "8001:8001"
    volumes:
      - ./backend:/app

  # Frontend (React)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: zeiterfassung-frontend
    restart: always
    env_file:
      - ./frontend/.env
    depends_on:
      - backend
    networks:
      - app-network
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
```

### Backend Dockerfile erstellen

```bash
nano backend/Dockerfile
```

**Inhalt:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System-Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python-Abhängigkeiten kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App-Code kopieren
COPY . .

# Port exponieren
EXPOSE 8001

# App starten
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Dockerfile erstellen

```bash
nano frontend/Dockerfile
```

**Inhalt für Entwicklung:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# App-Code kopieren
COPY . .

# Port exponieren
EXPOSE 3000

# Development-Server starten
CMD ["yarn", "start"]
```

**Oder für Production-Build:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Abhängigkeiten
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build
COPY . .
RUN yarn build

# Production Server (nginx)
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf für Production (wenn Production-Build verwendet):**
```bash
nano frontend/nginx.conf
```

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Compose starten

```bash
# Container bauen und starten
docker compose up -d --build

# Logs anschauen
docker compose logs -f

# Status prüfen
docker compose ps
```

---

## 8. Nginx als Reverse Proxy

### Nginx installieren (auf dem Host-System)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/zeiterfassung
```

**Inhalt:**
```nginx
server {
    listen 80;
    server_name zeiterfassung.ihre-domain.de;

    # Maximale Upload-Größe
    client_max_body_size 10M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Site aktivieren

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/zeiterfassung /etc/nginx/sites-enabled/

# Standard-Site deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

---

## 9. SSL-Zertifikate mit Let's Encrypt

### Certbot installieren

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### SSL-Zertifikat erstellen

```bash
sudo certbot --nginx -d zeiterfassung.ihre-domain.de
```

**Folgen Sie den Anweisungen:**
- E-Mail-Adresse eingeben
- Nutzungsbedingungen akzeptieren
- Redirect auf HTTPS wählen (empfohlen)

### Automatische Erneuerung testen

```bash
# Test-Modus
sudo certbot renew --dry-run

# Certbot erneuert automatisch via Cronjob
```

### Nginx-Konfiguration nach SSL

Certbot hat Ihre Nginx-Config automatisch angepasst. Prüfen Sie:

```bash
sudo nano /etc/nginx/sites-available/zeiterfassung
```

Es sollte jetzt einen SSL-Block geben:
```nginx
server {
    listen 443 ssl;
    server_name zeiterfassung.ihre-domain.de;
    
    ssl_certificate /etc/letsencrypt/live/zeiterfassung.ihre-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zeiterfassung.ihre-domain.de/privkey.pem;
    
    # ... Rest der Konfiguration
}

server {
    listen 80;
    server_name zeiterfassung.ihre-domain.de;
    return 301 https://$server_name$request_uri;
}
```

---

## 10. App starten und testen

### Container-Status prüfen

```bash
cd ~/zeiterfassung-app
docker compose ps
```

**Sollte zeigen:**
```
NAME                          STATUS
zeiterfassung-backend         Up
zeiterfassung-frontend        Up
zeiterfassung-mongodb         Up
```

### Logs prüfen

```bash
# Alle Logs
docker compose logs -f

# Nur Backend
docker compose logs -f backend

# Nur Frontend
docker compose logs -f frontend
```

### App im Browser testen

1. **Öffnen Sie:** `https://zeiterfassung.ihre-domain.de`
2. **Login testen:**
   - User: `user` / Passwort: `user`
   - Admin: `administrator` / Passwort: `admin`
3. **Funktionen testen:**
   - Mitarbeiter anlegen
   - Zeiterfassung
   - CSV-Export

### PWA installieren

1. **Chrome/Edge auf Android/iOS:**
   - App öffnen
   - Browser-Menü → "Zum Startbildschirm hinzufügen"
2. **Testen Sie NFC (Android) und QR-Scanner (iOS)**

---

## 11. Wartung und Updates

### App-Updates deployen

```bash
cd ~/zeiterfassung-app

# Code aktualisieren (von GitHub)
git pull origin main

# Container neu bauen und starten
docker compose down
docker compose up -d --build

# Logs prüfen
docker compose logs -f
```

### Datenbank-Backup

```bash
# Backup erstellen
docker exec zeiterfassung-mongodb mongodump --db zeiterfassung_production --out /data/backup

# Backup vom Container kopieren
docker cp zeiterfassung-mongodb:/data/backup ./backup-$(date +%Y%m%d)

# Auf sicheren Speicher kopieren
scp -r backup-$(date +%Y%m%d) user@backup-server:/backups/
```

### Automatisches Backup (Cronjob)

```bash
# Backup-Script erstellen
nano ~/backup-zeiterfassung.sh
```

**Inhalt:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR

# MongoDB Backup
docker exec zeiterfassung-mongodb mongodump --db zeiterfassung_production --out /data/backup/$DATE

# Backup kopieren
docker cp zeiterfassung-mongodb:/data/backup/$DATE $BACKUP_DIR/

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;

echo "Backup erstellt: $BACKUP_DIR/$DATE"
```

**Cronjob einrichten:**
```bash
chmod +x ~/backup-zeiterfassung.sh

# Crontab bearbeiten
crontab -e

# Tägliches Backup um 2 Uhr nachts
0 2 * * * ~/backup-zeiterfassung.sh >> ~/backup.log 2>&1
```

### System-Updates

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Docker-Images aktualisieren
cd ~/zeiterfassung-app
docker compose pull
docker compose up -d

# Alte Images entfernen
docker image prune -a -f
```

---

## 12. Backup-Strategie

### Was sollte gesichert werden?

1. **MongoDB-Datenbank** (wichtigste Komponente!)
2. **Umgebungsvariablen** (`.env` Dateien)
3. **Hochgeladene Dateien** (falls vorhanden)
4. **Nginx-Konfiguration**
5. **SSL-Zertifikate** (optional, können neu erstellt werden)

### 3-2-1 Backup-Regel

- **3** Kopien Ihrer Daten
- **2** verschiedene Speichermedien
- **1** Kopie off-site (z.B. Cloud-Storage)

### Backup-Tools

- **Lokales Backup:** `mongodump`, `rsync`
- **Cloud-Backup:** AWS S3, Google Cloud Storage, Backblaze B2
- **Automatisierung:** `restic`, `duplicity`, `borg`

### Datenbank wiederherstellen

```bash
# Backup wiederherstellen
docker exec -i zeiterfassung-mongodb mongorestore --db zeiterfassung_production /data/backup/BACKUP_DATUM
```

---

## 13. Troubleshooting

### Container startet nicht

```bash
# Container-Status prüfen
docker compose ps

# Logs anschauen
docker compose logs backend
docker compose logs frontend

# Container neu starten
docker compose restart backend
```

### MongoDB Connection Error

**Problem:** `MongoServerSelectionTimeoutError`

**Lösung:**
```bash
# MongoDB-Status prüfen
docker compose logs mongodb

# MongoDB neu starten
docker compose restart mongodb

# Connection String in .env prüfen
nano backend/.env
```

### Frontend lädt nicht

**Problem:** Weiße Seite oder 502 Bad Gateway

**Lösung:**
```bash
# Frontend-Logs prüfen
docker compose logs frontend

# Frontend neu bauen
docker compose up -d --build frontend

# Nginx-Fehlerlog prüfen
sudo tail -f /var/log/nginx/error.log
```

### NFC funktioniert nicht

**Problem:** "NFC wird auf diesem Gerät nicht unterstützt"

**Ursachen:**
- Web NFC API erfordert HTTPS
- Browser unterstützt keine Web NFC API
- NFC-Hardware fehlt oder deaktiviert

**Lösung:**
- Stellen Sie sicher, dass SSL aktiviert ist
- Verwenden Sie Chrome 89+ auf Android
- Fallback: QR-Code-Scanner oder manuelle Eingabe

### SSL-Zertifikat erneuern schlägt fehl

```bash
# Certbot-Logs prüfen
sudo certbot renew --dry-run

# Manuelle Erneuerung
sudo certbot renew --force-renewal

# Nginx neu laden
sudo systemctl reload nginx
```

### Hohe Server-Last

```bash
# Resource-Nutzung prüfen
docker stats

# Einzelne Container analysieren
docker top zeiterfassung-backend
docker top zeiterfassung-frontend

# Logs auf Fehler prüfen
docker compose logs --tail=100
```

### Port bereits belegt

**Problem:** `Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use`

**Lösung:**
```bash
# Prozess finden
sudo lsof -i :3000

# Prozess beenden
sudo kill -9 PID

# Oder Port in docker-compose.yml ändern
```

---

## 📚 Zusätzliche Ressourcen

### Dokumentation
- Docker: https://docs.docker.com/
- MongoDB: https://docs.mongodb.com/
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

### Monitoring (optional)

**Uptime-Monitoring:**
- UptimeRobot (kostenlos): https://uptimerobot.com/
- Pingdom
- StatusCake

**Server-Monitoring:**
- Netdata (kostenlos, selbst gehostet)
- Prometheus + Grafana
- New Relic

**Log-Management:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Graylog
- Loki

### Sicherheit

**Best Practices:**
1. Regelmäßige Updates durchführen
2. Starke Passwörter verwenden
3. SSH-Key-Authentifizierung aktivieren
4. Fail2ban installieren (Brute-Force-Schutz)
5. Firewall richtig konfigurieren
6. Backups regelmäßig testen
7. Monitoring einrichten

**Fail2ban installieren:**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🎉 Fertig!

Ihre Zeiterfassungs-App läuft jetzt auf Ihrem eigenen Server!

### Checkliste nach Deployment:

- [ ] App ist über HTTPS erreichbar
- [ ] Login funktioniert (User + Admin)
- [ ] Mitarbeiter können angelegt werden
- [ ] Zeiterfassung funktioniert
- [ ] NFC-Scanner funktioniert (Android)
- [ ] QR-Scanner funktioniert (iOS)
- [ ] CSV-Export funktioniert
- [ ] E-Mail-Versand funktioniert
- [ ] PWA ist installierbar
- [ ] Backups sind eingerichtet
- [ ] Monitoring ist aktiv

### Support

Bei Fragen oder Problemen:
- GitHub Issues: (Ihr Repository)
- Emergent Support: support@emergent.com
- Community-Foren: Docker, Stack Overflow

---

**Viel Erfolg mit Ihrer Self-Hosted Zeiterfassungs-App!** 🚀
