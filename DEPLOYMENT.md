# Deployment-Anweisungen für die Zeiterfassungs-App

## ✅ Automatische URL-Erkennung für Passwort-Reset

Die App erkennt **automatisch die richtige URL**, egal wo sie deployed ist!

### Wie es funktioniert

1. **Automatische Erkennung**: Das Frontend sendet seine eigene URL (`window.location.origin`) beim Passwort-Reset mit
2. **Fallback-Mechanismen**: 
   - Primär: Vom Frontend gesendete URL
   - Sekundär: `FRONTEND_URL` Umgebungsvariable (optional)
   - Notfall: Preview-URL

### Keine Konfiguration erforderlich! 🎉

Der Administrator-Passwort-Reset-Link wird automatisch mit der korrekten Domain generiert:
- Preview: `https://trackshift-2.preview.emergentagent.com/reset-password?token=xxx`
- Production: `https://ihre-deployed-domain.com/reset-password?token=xxx`
- Custom Domain: `https://zeiterfassung.firma.de/reset-password?token=xxx`

### Optional: Manuelle Konfiguration (nur falls gewünscht)

Falls Sie die URL manuell festlegen möchten, können Sie die Umgebungsvariable setzen:

**Backend .env-Datei** (`/app/backend/.env`):
```
FRONTEND_URL="https://ihre-domain.com"
```

Nach .env-Änderungen Backend neu starten:
```bash
sudo supervisorctl restart backend
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

Die URL sollte automatisch korrekt sein! ✅

## Support

Bei Fragen zum Deployment kontaktieren Sie den Emergent-Support.
