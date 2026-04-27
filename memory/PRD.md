# Zeiterfassung App - PRD

## Original Problem Statement
Zeiterfassungsanwendung für Mitarbeiter mit NFC/QR-Code Login auf Android/iOS Tablets.

## Core Features (Implemented)
- ✅ User/Administrator/Betriebsleiter Rollen-System
- ✅ NFC-basierter Login für Android-Geräte
- ✅ Kamera-basierter QR-Code Scanner für iOS-Geräte
- ✅ Mitarbeiterverwaltung mit Abteilungen
- ✅ Zeiteinträge (Arbeitsbeginn, Pause, Pausenende, Ende)
- ✅ Client-seitige Zeitstempel (lokale Zeitzone)
- ✅ SMTP E-Mail-Konfiguration für tägliche Reports
- ✅ CSV-Export aller Zeiterfassungsdaten
- ✅ Backup & Restore Funktionalität (JSON)
- ✅ Dynamische Passwort-Reset-URLs
- ✅ **Betriebsleiter-Übersicht** mit Mitarbeiter-Status und Abteilungs-Filter

## Architecture

### Frontend (React)
```
/app/frontend/src/
├── App.js                     # Hauptkomponente
├── config/
│   └── api.js                 # API-Konfiguration
├── hooks/
│   ├── useAuth.js             # Authentifizierung
│   ├── useEmployees.js        # Mitarbeiterverwaltung
│   ├── useSettings.js         # Einstellungen
│   ├── useDeviceType.js       # Geräteerkennung
│   └── useMessage.js          # Toast-Nachrichten
└── components/
    ├── views/
    │   ├── LoginScreen.jsx
    │   ├── TerminalView.jsx
    │   ├── AdminView.jsx
    │   ├── SettingsView.jsx
    │   └── BetriebsleiterView.jsx  # NEU
    └── modals/
        ├── PasswordModal.jsx
        ├── EditEmployeeModal.jsx
        └── QRScannerModal.jsx
```

### Backend (FastAPI)
- `server.py`: API-Endpunkte, MongoDB-Integration, Scheduler

### Database (MongoDB)
- `employees`: Mitarbeiterdaten
- `time_entries`: Zeiteinträge
- `settings`: App-Einstellungen
- `users`: Benutzerkonten (user, administrator, betriebsleiter)

## Credentials
- User: `user` / `user`
- Betriebsleiter: `betriebsleiter` / `betrieb`
- Administrator: `administrator` / `admin`

## API Endpoints (Betriebsleiter)
- `GET /api/employee-status` - Alle Mitarbeiter mit letztem Zeiteintrag
- `GET /api/employee-status?abteilung=Holz` - Gefiltert nach Abteilung
- `GET /api/departments` - Liste aller Abteilungen

## Upcoming Tasks

### P1: Offline-Funktionalität
- Lokale Speicherung bei fehlender Internetverbindung
- Spätere Synchronisation

## Change History

### 2025-03-13: Passwort-Reset Bug Fix
- Neue `ResetPasswordView.jsx` Komponente erstellt
- URL-Parameter `/reset-password?token=...` wird jetzt korrekt verarbeitet
- Vollständiger Reset-Flow: Link klicken → Neues Passwort eingeben → Erfolgsmeldung → Zur Anmeldung

### 2025-03-13: Betriebsleiter-Rolle
- Neuer Benutzer "betriebsleiter" mit Rolle "betriebsleiter"
- Neue View `BetriebsleiterView.jsx` mit:
  - Statistik-Dashboard (Arbeiten, Pause, Nach Pause, Feierabend, Kein Status)
  - Abteilungs-Filter (Alle, Holz, Kunststoff, Montage, Verwaltung)
  - Mitarbeiter-Tabelle mit letztem Status, Datum und Uhrzeit
  - Auto-Refresh alle 30 Sekunden
  - Farbcodierte Status-Anzeige
- Backend-Endpoints: `/api/employee-status`, `/api/departments`

### 2025-03-13: Frontend Refactoring
- App.js von 1620 auf ~300 Zeilen reduziert
- Komponenten in separate Dateien aufgeteilt
- Custom Hooks für State-Management extrahiert
