# Zeiterfassung App - PRD

## Original Problem Statement
Zeiterfassungsanwendung für Mitarbeiter mit NFC/QR-Code Login auf Android/iOS Tablets.

## Core Features (Implemented)
- ✅ User/Administrator Rollen-System
- ✅ NFC-basierter Login für Android-Geräte
- ✅ Kamera-basierter QR-Code Scanner für iOS-Geräte
- ✅ Mitarbeiterverwaltung mit Abteilungen
- ✅ Zeiteinträge (Arbeitsbeginn, Pause, Pausenende, Ende)
- ✅ Client-seitige Zeitstempel (lokale Zeitzone)
- ✅ SMTP E-Mail-Konfiguration für tägliche Reports
- ✅ CSV-Export aller Zeiterfassungsdaten
- ✅ Backup & Restore Funktionalität (JSON)
- ✅ Dynamische Passwort-Reset-URLs

## Architecture

### Frontend (React)
```
/app/frontend/src/
├── App.js                     # Hauptkomponente (278 Zeilen)
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
    │   └── SettingsView.jsx
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
- `users`: Benutzerkonten

## Credentials
- User: `user` / `user`
- Administrator: `administrator` / `admin`

## Upcoming Tasks

### P0: Betriebsleiter Rolle
- Neue Rolle für Operations Manager
- Übersicht aller Mitarbeiter mit letztem Status
- API: `GET /api/employee-status`
- Frontend: Neue View-Komponente

### P1: Offline-Funktionalität
- Lokale Speicherung bei fehlender Internetverbindung
- Spätere Synchronisation

## Refactoring History

### 2025-03-13: Frontend Refactoring
- App.js von 1620 auf 278 Zeilen reduziert
- Komponenten in separate Dateien aufgeteilt
- Custom Hooks für State-Management extrahiert
- data-testid Attribute hinzugefügt
