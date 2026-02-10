# Externer Zugriff auf die Zeiterfassungs-App (Portweiterleitung)

Diese Anleitung erklärt, wie Sie die App intern UND extern zugänglich machen.

## 🔍 Problem beschrieben

**Symptom:**
- ✅ Intern funktioniert alles (192.168.1.100)
- ✅ Extern erreichen Sie die Login-Seite
- ❌ Login funktioniert extern nicht

**Ursache:**
Das Frontend sendet API-Requests an die interne IP, die von außen nicht erreichbar ist.

---

## ✅ Lösung implementiert

### **Dynamische Backend-URL**

Die App wurde so angepasst, dass sie **automatisch** die richtige URL verwendet:

```javascript
// Frontend erkennt automatisch die aktuelle Domain
const BACKEND_URL = window.location.origin;

// Beispiele:
// Intern:  http://192.168.1.100:3000 → Backend: http://192.168.1.100:3000/api
// Extern:  http://85.123.45.67:3000  → Backend: http://85.123.45.67:3000/api
// Domain:  https://zeiterfassung.de  → Backend: https://zeiterfassung.de/api
```

**Vorteile:**
- ✅ Funktioniert intern automatisch
- ✅ Funktioniert extern automatisch
- ✅ Funktioniert mit Portweiterleitung
- ✅ Funktioniert mit Domain
- ✅ Keine manuelle Konfiguration nötig

---

## 🌐 Router-Konfiguration (Portweiterleitung)

### Was muss weitergeleitet werden?

**Für einfachen Setup:**
```
Externe Port 3000 → Interne IP:3000 (Frontend + Backend zusammen)
```

**WICHTIG:** Backend muss auf demselben Port/derselben Domain erreichbar sein wie das Frontend!

### Option A: Alle Ports auf einen (Nginx-Setup)

**Empfohlen für externe Zugriffe!**

Mit Nginx läuft alles über einen Port:
```
Port 80/443 → Nginx
  ├─ / → Frontend (Port 3000)
  └─ /api → Backend (Port 8001)
```

**Router-Portweiterleitung:**
```
Extern Port 80   → Server-IP:80   (HTTP)
Extern Port 443  → Server-IP:443  (HTTPS, optional)
```

### Option B: Separate Ports (Nicht empfohlen für extern!)

```
Extern Port 3000 → Server-IP:3000 (Frontend)
Extern Port 8001 → Server-IP:8001 (Backend)
```

**Problem:** Browser-Sicherheit blockiert oft Requests zwischen verschiedenen Ports (Mixed Content).

---

## 🔧 Setup-Anleitung

### Schritt 1: Nginx als Reverse Proxy einrichten

**Nginx installieren (falls nicht vorhanden):**
```bash
sudo apt install nginx -y
```

**Nginx-Konfiguration erstellen:**
```bash
sudo nano /etc/nginx/sites-available/zeiterfassung
```

**Inhalt:**
```nginx
server {
    listen 80;
    server_name _;  # Akzeptiert alle Domains/IPs
    
    # Maximale Upload-Größe
    client_max_body_size 10M;
    
    # Frontend - alle Requests außer /api
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
    
    # Backend - nur /api Requests
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS Headers (zusätzlich zum Backend)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        # Preflight Requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

**Nginx aktivieren:**
```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/zeiterfassung /etc/nginx/sites-enabled/

# Standard-Site deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Konfiguration testen
sudo nginx -t

# Nginx starten/neu laden
sudo systemctl restart nginx
```

### Schritt 2: Router-Portweiterleitung einrichten

**In Ihrem Router (z.B. Fritzbox, Telekom Speedport, etc.):**

1. **Einloggen** in Router-Webinterface
2. **Port-Freigaben/Portweiterleitung** öffnen
3. **Neue Regel erstellen:**
   ```
   Name: Zeiterfassung-HTTP
   Protokoll: TCP
   Externe Port: 80
   Interne IP: [IP Ihres Servers, z.B. 192.168.1.100]
   Interne Port: 80
   ```

4. **Optional - HTTPS (wenn Sie SSL haben):**
   ```
   Name: Zeiterfassung-HTTPS
   Protokoll: TCP
   Externe Port: 443
   Interne IP: [IP Ihres Servers]
   Interne Port: 443
   ```

5. **Speichern**

### Schritt 3: Firewall-Regeln anpassen

**Auf dem Server:**
```bash
# Port 80 (HTTP) öffnen
sudo ufw allow 80/tcp

# Optional: Port 443 (HTTPS)
sudo ufw allow 443/tcp

# Firewall neu laden
sudo ufw reload

# Status prüfen
sudo ufw status
```

### Schritt 4: Testen

**Intern testen:**
```
http://192.168.1.100
```

**Extern testen:**
```
http://IHRE-EXTERNE-IP
```

**Externe IP herausfinden:**
```bash
curl ifconfig.me
# Oder im Browser: https://www.wieistmeineip.de/
```

---

## 🔍 Troubleshooting

### Problem 1: "502 Bad Gateway"

**Ursache:** Nginx kann Backend/Frontend nicht erreichen

**Lösung:**
```bash
# Prüfe ob Container laufen
docker compose ps

# Container neu starten
docker compose restart

# Nginx-Logs prüfen
sudo tail -f /var/log/nginx/error.log
```

### Problem 2: Login funktioniert immer noch nicht

**Browser-Console öffnen (F12) und prüfen:**

1. **Network-Tab öffnen**
2. **Login versuchen**
3. **Prüfen Sie die API-Requests:**
   - URL sollte sein: `http://IHRE-IP/api/auth/login`
   - Status sollte sein: `200 OK`
   - Wenn `CORS Error`: CORS-Problem (siehe unten)
   - Wenn `404`: Backend nicht erreichbar

**In Browser-Console sollte stehen:**
```
🔗 Backend-URL: http://IHRE-EXTERNE-IP
🔗 API-Endpunkt: http://IHRE-EXTERNE-IP/api
```

### Problem 3: CORS-Fehler in Browser-Console

**Fehler:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Lösung 1 - Backend .env prüfen:**
```bash
nano /app/backend/.env
```

Stellen Sie sicher:
```env
CORS_ORIGINS="*"
```

**Lösung 2 - Backend neu starten:**
```bash
docker compose restart backend
```

**Lösung 3 - Nginx CORS-Headers prüfen:**
Siehe Nginx-Konfiguration oben (bereits enthalten).

### Problem 4: "Mixed Content" Warnung

**Ursache:** HTTPS-Seite versucht HTTP-Request zu machen

**Lösung:** Entweder alles auf HTTP oder alles auf HTTPS
- HTTP intern + HTTP extern ✅
- HTTPS intern + HTTPS extern ✅
- HTTP intern + HTTPS extern ❌

### Problem 5: Verbindung wird abgelehnt

**Prüfen Sie:**

```bash
# Ist Nginx aktiv?
sudo systemctl status nginx

# Ist der Port offen?
sudo netstat -tlnp | grep :80

# Ist die Portweiterleitung aktiv?
# → Im Router prüfen

# Von extern testen (auf externem Gerät):
curl http://IHRE-EXTERNE-IP
```

---

## 📱 Mobile Geräte extern nutzen

### Szenario: Mitarbeiter von zu Hause auf App zugreifen

**Mit statischer IP oder DynDNS:**

1. **DynDNS einrichten** (z.B. No-IP, DuckDNS)
   ```
   zeiterfassung.duckdns.org → Ihre externe IP
   ```

2. **SSL-Zertifikat (optional, aber empfohlen):**
   ```bash
   sudo certbot --nginx -d zeiterfassung.duckdns.org
   ```

3. **Mitarbeiter können zugreifen:**
   ```
   https://zeiterfassung.duckdns.org
   ```

**Ohne feste IP:**
- Externe IP ändert sich regelmäßig
- Mitarbeiter müssen neue IP kennen
- Nicht praktikabel für Produktiv-Einsatz

---

## 🔐 Sicherheits-Empfehlungen

### Für externen Zugriff:

1. **SSL/HTTPS verwenden** (Let's Encrypt ist kostenlos)
2. **Starke Passwörter** für Admin-Account
3. **VPN verwenden** (idealerweise)
4. **Fail2ban** installieren (gegen Brute-Force)
5. **Firewall** richtig konfigurieren
6. **Regelmäßige Backups**

### VPN-Lösung (Sicherste Option):

Statt Portweiterleitung:
1. **WireGuard VPN** auf Server installieren
2. Mitarbeiter verbinden sich per VPN
3. Zugriff nur über VPN möglich
4. Keine Ports nach außen öffnen nötig

---

## 📊 Zusammenfassung: Setup-Optionen

### Option 1: Nginx Reverse Proxy (Empfohlen)
```
Extern Port 80 → Nginx → Frontend + Backend (/api)
```
- ✅ Einfachste Konfiguration
- ✅ Funktioniert zuverlässig
- ✅ SSL einfach hinzuzufügen
- ✅ Keine CORS-Probleme

### Option 2: Direct Port-Forwarding (Nicht empfohlen)
```
Extern Port 3000 → Frontend
Extern Port 8001 → Backend
```
- ❌ CORS-Probleme
- ❌ Browser-Sicherheit blockiert
- ❌ Komplizierte Konfiguration

### Option 3: VPN (Sicherste)
```
VPN → Internes Netzwerk → App
```
- ✅ Maximale Sicherheit
- ✅ Keine Ports öffnen
- ❌ VPN-Setup erforderlich
- ❌ Mitarbeiter brauchen VPN-Client

---

## ✅ Nach der Implementierung testen:

**Checklist:**
```
□ Intern erreichbar (192.168.x.x)
□ Extern erreichbar (Externe IP)
□ Login funktioniert intern
□ Login funktioniert extern
□ Zeiterfassung funktioniert extern
□ NFC/QR-Scanner funktioniert extern
□ Browser-Console zeigt keine Fehler
□ Nginx läuft (systemctl status nginx)
□ Docker-Container laufen (docker compose ps)
```

---

**Ihre App sollte jetzt intern UND extern funktionieren!** 🎉

Bei weiteren Fragen oder Problemen, bitte melden!
