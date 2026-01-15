# Deployment-Anweisungen für die Zeiterfassungs-App

## Wichtig: Frontend-URL für Passwort-Reset konfigurieren

### Problem
Der Administrator-Passwort-Reset-Link verwendet eine Umgebungsvariable für die Frontend-URL. Diese muss beim Deployment auf die tatsächliche Domain angepasst werden.

### Lösung

**Bei Deployment auf Emergent oder einem anderen Server:**

1. **Öffnen Sie die Backend .env-Datei** (`/app/backend/.env`)

2. **Passen Sie die FRONTEND_URL an:**
   ```
   FRONTEND_URL="https://ihre-deployed-domain.com"
   ```
   
   Beispiele:
   - Preview: `https://trackshift-2.preview.emergentagent.com`
   - Production: `https://ihre-domain.com`
   - Custom Domain: `https://zeiterfassung.firma.de`

3. **Backend neu starten** (nach .env-Änderung erforderlich):
   ```bash
   sudo supervisorctl restart backend
   ```

### Wie es funktioniert

- Der Passwort-Reset-Link wird automatisch mit der konfigurierten `FRONTEND_URL` generiert
- Bei Passwort-Reset-Anfrage erhält der Admin eine E-Mail mit dem Link:
  ```
  https://ihre-deployed-domain.com/reset-password?token=xxx
  ```

### Standard-Wert

Falls `FRONTEND_URL` nicht gesetzt ist, wird automatisch die Preview-URL verwendet:
```
https://trackshift-2.preview.emergentagent.com
```

## Weitere Konfigurationen

### SMTP-Einstellungen
Werden über die Admin-Oberfläche unter "Einstellungen" konfiguriert:
- SMTP-Server
- SMTP-Port
- TLS verwenden
- Sender-E-Mail
- Sender-Passwort
- Empfänger-E-Mail
- Admin-Reset-E-Mail

### MongoDB
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
```

### CORS
```
CORS_ORIGINS="*"  # Für Produktion sollte dies auf spezifische Domains eingeschränkt werden
```

## Nach dem Deployment prüfen

1. Passwort-Reset-E-Mail anfordern (als Admin)
2. Prüfen Sie, ob der Link auf die richtige Domain zeigt
3. Klicken Sie auf den Link und testen Sie das Zurücksetzen

## Support

Bei Fragen zum Deployment kontaktieren Sie den Emergent-Support.
