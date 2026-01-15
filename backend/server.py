from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import csv
import io
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import aiosmtplib
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ========== Models ==========

# Employee Models
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personalnummer: str
    vorname: str
    nachname: str
    abteilung: str = "Holz"  # Default: Holz, Kunststoff, Montage, Verwaltung
    nfc_chip_id: Optional[str] = None  # NFC-Chip-ID für Android-Tablets
    qr_code: Optional[str] = None  # QR-Code für iOS-Tablets (mindestens 8 Zeichen)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    personalnummer: str
    vorname: str
    nachname: str
    abteilung: str = "Holz"
    nfc_chip_id: Optional[str] = None
    qr_code: Optional[str] = None

class EmployeeUpdate(BaseModel):
    personalnummer: Optional[str] = None
    vorname: Optional[str] = None
    nachname: Optional[str] = None
    abteilung: Optional[str] = None
    nfc_chip_id: Optional[str] = None
    qr_code: Optional[str] = None


# Time Entry Models
class TimeEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personalnummer: str
    button_type: str  # "Arbeitsbeginn", "Pause", "Pausenende", "Ende"
    datum: str  # Format: YYYY-MM-DD
    uhrzeit: str  # Format: HH:MM:SS
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TimeEntryCreate(BaseModel):
    personalnummer: str
    button_type: str


# Settings Models
class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default="settings")
    email_sender: Optional[str] = None
    email_password: Optional[str] = None
    email_recipient: Optional[str] = None
    smtp_server: str = "mail.gmx.net"  # SMTP Server
    smtp_port: int = 587  # SMTP Port
    use_tls: bool = True  # TLS verwenden
    send_time: str = "18:00"  # Default send time
    last_send_date: Optional[str] = None
    last_download_datetime: Optional[str] = None
    admin_reset_email: Optional[str] = None  # Email für Admin-Passwort-Reset

class SettingsUpdate(BaseModel):
    email_sender: Optional[str] = None
    email_password: Optional[str] = None
    email_recipient: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    use_tls: Optional[bool] = None
    send_time: Optional[str] = None
    admin_reset_email: Optional[str] = None


# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str  # "user" oder "administrator"
    password: str
    role: str  # "user" oder "admin"
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordChange(BaseModel):
    username: str
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    username: str
    frontend_url: Optional[str] = None  # Frontend sendet seine eigene URL mit

class NFCLogin(BaseModel):
    nfc_chip_id: str

class QRLogin(BaseModel):
    qr_code: str


# ========== Employee Endpoints ==========

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate):
    """Neuen Mitarbeiter anlegen"""
    # Check if personalnummer already exists
    existing = await db.employees.find_one({"personalnummer": employee.personalnummer}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Personalnummer existiert bereits")
    
    # Validate QR code length if provided (only for non-empty strings)
    if employee.qr_code and employee.qr_code.strip() and len(employee.qr_code.strip()) < 8:
        raise HTTPException(status_code=400, detail="QR-Code muss mindestens 8 Zeichen lang sein")
    
    # Check for duplicate NFC chip ID (only for non-empty strings)
    if employee.nfc_chip_id and employee.nfc_chip_id.strip():
        duplicate_nfc = await db.employees.find_one({"nfc_chip_id": employee.nfc_chip_id.strip()}, {"_id": 0})
        if duplicate_nfc:
            raise HTTPException(status_code=400, detail="NFC-Chip-ID wird bereits verwendet")
    
    # Check for duplicate QR code (only for non-empty strings)
    if employee.qr_code and employee.qr_code.strip():
        duplicate_qr = await db.employees.find_one({"qr_code": employee.qr_code.strip()}, {"_id": 0})
        if duplicate_qr:
            raise HTTPException(status_code=400, detail="QR-Code wird bereits verwendet")
    
    employee_obj = Employee(**employee.model_dump())
    doc = employee_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.employees.insert_one(doc)
    return employee_obj


@api_router.get("/employees", response_model=List[Employee])
async def get_employees():
    """Alle Mitarbeiter abrufen"""
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    
    for emp in employees:
        if isinstance(emp.get('created_at'), str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    
    return employees


@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate):
    """Mitarbeiter bearbeiten"""
    existing = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    # If personalnummer is being updated, check if it's unique
    if employee_update.personalnummer and employee_update.personalnummer != existing['personalnummer']:
        duplicate = await db.employees.find_one(
            {"personalnummer": employee_update.personalnummer, "id": {"$ne": employee_id}},
            {"_id": 0}
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Personalnummer existiert bereits")
    
    # Validate QR code length if provided (only for non-empty strings)
    if employee_update.qr_code and employee_update.qr_code.strip() and len(employee_update.qr_code.strip()) < 8:
        raise HTTPException(status_code=400, detail="QR-Code muss mindestens 8 Zeichen lang sein")
    
    # Check for duplicate NFC chip ID (excluding current employee, only for non-empty strings)
    if employee_update.nfc_chip_id and employee_update.nfc_chip_id.strip():
        duplicate_nfc = await db.employees.find_one(
            {"nfc_chip_id": employee_update.nfc_chip_id.strip(), "id": {"$ne": employee_id}},
            {"_id": 0}
        )
        if duplicate_nfc:
            raise HTTPException(status_code=400, detail="NFC-Chip-ID wird bereits verwendet")
    
    # Check for duplicate QR code (excluding current employee, only for non-empty strings)
    if employee_update.qr_code and employee_update.qr_code.strip():
        duplicate_qr = await db.employees.find_one(
            {"qr_code": employee_update.qr_code.strip(), "id": {"$ne": employee_id}},
            {"_id": 0}
        )
        if duplicate_qr:
            raise HTTPException(status_code=400, detail="QR-Code wird bereits verwendet")
    
    update_data = {k: v for k, v in employee_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    updated = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Employee(**updated)


@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    """Mitarbeiter löschen"""
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    return {"message": "Mitarbeiter erfolgreich gelöscht"}


# ========== Time Entry Endpoints ==========

@api_router.post("/time-entries", response_model=TimeEntry)
async def create_time_entry(entry: TimeEntryCreate):
    """Zeitstempel erfassen"""
    # Verify employee exists
    employee = await db.employees.find_one({"personalnummer": entry.personalnummer}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    now = datetime.now()
    entry_obj = TimeEntry(
        personalnummer=entry.personalnummer,
        button_type=entry.button_type,
        datum=now.strftime("%Y-%m-%d"),
        uhrzeit=now.strftime("%H:%M:%S")
    )
    
    doc = entry_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.time_entries.insert_one(doc)
    return entry_obj


@api_router.get("/time-entries", response_model=List[TimeEntry])
async def get_time_entries(datum: Optional[str] = None):
    """Zeitstempel abrufen (optional gefiltert nach Datum)"""
    query = {}
    if datum:
        query['datum'] = datum
    
    entries = await db.time_entries.find(query, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    
    for entry in entries:
        if isinstance(entry.get('timestamp'), str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return entries


# ========== Settings Endpoints ==========

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    """Email-Einstellungen abrufen"""
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    
    if not settings:
        # Create default settings
        default_settings = Settings()
        doc = default_settings.model_dump()
        await db.settings.insert_one(doc)
        return default_settings
    
    return Settings(**settings)


@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate):
    """Email-Einstellungen aktualisieren"""
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.settings.update_one(
            {"id": "settings"},
            {"$set": update_data},
            upsert=True
        )
        
        # Update scheduler if send_time was changed
        if "send_time" in update_data:
            await update_scheduler_time()
    
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    return Settings(**settings)


# ========== User Management Endpoints ==========

@api_router.post("/init-users")
async def init_users():
    """Initialisiere Standard-Benutzer (falls nicht vorhanden)"""
    # Check if users exist
    user_count = await db.users.count_documents({})
    
    if user_count == 0:
        # Create default users
        default_users = [
            User(username="user", password="user", role="user"),
            User(username="administrator", password="admin", role="admin")
        ]
        
        for user in default_users:
            doc = user.model_dump()
            await db.users.insert_one(doc)
        
        return {"message": "Standard-Benutzer erstellt", "users": ["user", "administrator"]}
    
    return {"message": "Benutzer existieren bereits"}


@api_router.post("/login")
async def login(login_data: UserLogin):
    """Benutzer-Login"""
    # Ensure users exist
    await init_users()
    
    user = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    
    if not user:
        return {"success": False, "message": "Benutzer nicht gefunden"}
    
    if user["password"] == login_data.password:
        return {
            "success": True, 
            "message": "Login erfolgreich",
            "role": user["role"],
            "username": user["username"]
        }
    else:
        return {"success": False, "message": "Falsches Passwort"}


@api_router.post("/nfc-login")
async def nfc_login(nfc_data: NFCLogin):
    """NFC-Chip Login für Mitarbeiter (Android-Tablets)"""
    if not nfc_data.nfc_chip_id or not nfc_data.nfc_chip_id.strip():
        return {"success": False, "message": "NFC-Chip-ID fehlt"}
    
    employee = await db.employees.find_one(
        {"nfc_chip_id": nfc_data.nfc_chip_id.strip()}, 
        {"_id": 0}
    )
    
    if not employee:
        return {"success": False, "message": "Mitarbeiter mit dieser NFC-Chip-ID nicht gefunden"}
    
    return {
        "success": True,
        "message": "Login erfolgreich",
        "employee": {
            "id": employee["id"],
            "personalnummer": employee["personalnummer"],
            "vorname": employee["vorname"],
            "nachname": employee["nachname"],
            "abteilung": employee["abteilung"]
        }
    }


@api_router.post("/qr-login")
async def qr_login(qr_data: QRLogin):
    """QR-Code Login für Mitarbeiter (iOS-Tablets)"""
    if not qr_data.qr_code or not qr_data.qr_code.strip():
        return {"success": False, "message": "QR-Code fehlt"}
    
    if len(qr_data.qr_code.strip()) < 8:
        return {"success": False, "message": "QR-Code muss mindestens 8 Zeichen lang sein"}
    
    employee = await db.employees.find_one(
        {"qr_code": qr_data.qr_code.strip()}, 
        {"_id": 0}
    )
    
    if not employee:
        return {"success": False, "message": "Mitarbeiter mit diesem QR-Code nicht gefunden"}
    
    return {
        "success": True,
        "message": "Login erfolgreich",
        "employee": {
            "id": employee["id"],
            "personalnummer": employee["personalnummer"],
            "vorname": employee["vorname"],
            "nachname": employee["nachname"],
            "abteilung": employee["abteilung"]
        }
    }


@api_router.post("/change-password")
async def change_password(password_change: PasswordChange):
    """Passwort ändern"""
    user = await db.users.find_one({"username": password_change.username}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    if user["password"] != password_change.old_password:
        raise HTTPException(status_code=400, detail="Altes Passwort ist falsch")
    
    await db.users.update_one(
        {"username": password_change.username},
        {"$set": {"password": password_change.new_password}}
    )
    
    return {"message": "Passwort erfolgreich geändert"}


@api_router.post("/request-password-reset")
async def request_password_reset(reset_request: PasswordResetRequest):
    """Passwort-Reset anfordern (nur für Administrator)"""
    if reset_request.username != "administrator":
        raise HTTPException(status_code=403, detail="Passwort-Reset nur für Administrator möglich")
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expiry = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    
    await db.users.update_one(
        {"username": "administrator"},
        {"$set": {"reset_token": reset_token, "reset_token_expiry": expiry}}
    )
    
    # Get admin reset email from settings
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    
    if not settings or not settings.get("admin_reset_email"):
        raise HTTPException(status_code=400, detail="Admin-Reset-Email nicht konfiguriert")
    
    # Send email with reset link
    try:
        # Verwende FRONTEND_URL aus Umgebungsvariable (fallback auf Preview für Entwicklung)
        frontend_url = os.environ.get('FRONTEND_URL', 'https://trackshift-2.preview.emergentagent.com')
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        
        msg = MIMEMultipart()
        msg['From'] = settings.get("email_sender", "")
        msg['To'] = settings["admin_reset_email"]
        msg['Subject'] = 'Passwort-Reset für Administrator'
        
        body = f"""Hallo Administrator,

Sie haben einen Passwort-Reset angefordert.

Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:
{reset_link}

Dieser Link ist 1 Stunde gültig.

Falls Sie keinen Reset angefordert haben, ignorieren Sie diese Email.

Mit freundlichen Grüßen
Zeiterfassungs-System
"""
        msg.attach(MIMEText(body, 'plain'))
        
        if settings.get("email_sender") and settings.get("email_password"):
            await aiosmtplib.send(
                msg,
                hostname=settings.get("smtp_server", "mail.gmx.net"),
                port=settings.get("smtp_port", 587),
                start_tls=settings.get("use_tls", True),
                username=settings["email_sender"],
                password=settings["email_password"],
            )
            return {"message": f"Reset-Link wurde an {settings['admin_reset_email']} gesendet"}
        else:
            # For testing without email configured
            return {"message": f"Reset-Token: {reset_token} (Email nicht konfiguriert)", "token": reset_token}
    
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        return {"message": f"Reset-Token: {reset_token} (Email-Versand fehlgeschlagen)", "token": reset_token}


@api_router.post("/reset-password-with-token")
async def reset_password_with_token(token: str, new_password: str):
    """Passwort mit Reset-Token zurücksetzen"""
    user = await db.users.find_one({"reset_token": token}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="Ungültiger Reset-Token")
    
    # Check if token is expired
    if user.get("reset_token_expiry"):
        expiry = datetime.fromisoformat(user["reset_token_expiry"])
        if datetime.now(timezone.utc) > expiry:
            raise HTTPException(status_code=400, detail="Reset-Token ist abgelaufen")
    
    # Reset password
    await db.users.update_one(
        {"reset_token": token},
        {"$set": {"password": new_password}, "$unset": {"reset_token": "", "reset_token_expiry": ""}}
    )
    
    return {"message": "Passwort erfolgreich zurückgesetzt"}


@api_router.post("/reset-user-password")
async def reset_user_password():
    """User-Passwort auf Standard zurücksetzen (nur von Admin)"""
    await db.users.update_one(
        {"username": "user"},
        {"$set": {"password": "user"}},
        upsert=True
    )
    return {"message": "User-Passwort wurde auf 'user' zurückgesetzt"}


@api_router.post("/verify-password")
async def verify_password(password: dict):
    """Legacy endpoint - deprecated"""
    return {"success": False, "message": "Bitte verwenden Sie /login"}


@api_router.post("/reset-password")
async def reset_password():
    """Legacy endpoint - deprecated"""
    return {"message": "Bitte verwenden Sie /reset-user-password"}


# ========== CSV Export & Email Functions ==========

def convert_button_type_to_code(button_type: str) -> str:
    """Convert button type to abbreviation code"""
    mapping = {
        'Arbeitsbeginn': 'AAB',
        'Ende': 'AAE',
        'Pause': 'AP',
        'Pausenende': 'AAB'
    }
    return mapping.get(button_type, button_type)


def convert_date_to_german_format(date_str: str) -> str:
    """Convert date from YYYY-MM-DD to DD.MM.YYYY"""
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        return date_obj.strftime("%d.%m.%Y")
    except:
        return date_str


async def generate_csv_data_since_last_download(last_download: Optional[str] = None) -> tuple:
    """Generate CSV data for all time entries since last download"""
    query = {}
    
    # If there was a last download, only get entries after that time
    if last_download:
        query['timestamp'] = {'$gt': last_download}
    
    entries = await db.time_entries.find(query, {"_id": 0}).sort("timestamp", 1).to_list(100000)
    
    if not entries:
        return None, []
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    # NO HEADER - as requested
    
    # Write data in new format: Button-Art, Uhrzeit, Datum (DD.MM.YYYY), Personalnummer
    entry_ids = []
    for entry in entries:
        writer.writerow([
            convert_button_type_to_code(entry['button_type']),  # Button-Art as code
            entry['uhrzeit'],                                     # Uhrzeit
            convert_date_to_german_format(entry['datum']),       # Datum in DD.MM.YYYY
            entry['personalnummer']                               # Personalnummer
        ])
        entry_ids.append(entry['id'])
    
    return output.getvalue(), entry_ids


async def generate_csv_data_all() -> str:
    """Generate CSV data for ALL time entries in database"""
    # Get ALL entries, sorted by timestamp
    entries = await db.time_entries.find({}, {"_id": 0}).sort("timestamp", 1).to_list(100000)
    
    if not entries:
        return None
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    # NO HEADER - as requested
    
    # Write data in format: Button-Art, Uhrzeit, Datum (DD.MM.YYYY), Personalnummer
    for entry in entries:
        writer.writerow([
            convert_button_type_to_code(entry['button_type']),  # Button-Art as code
            entry['uhrzeit'],                                     # Uhrzeit
            convert_date_to_german_format(entry['datum']),       # Datum in DD.MM.YYYY
            entry['personalnummer']                               # Personalnummer
        ])
    
    return output.getvalue()


async def send_email_with_csv(settings: Settings, csv_data: str):
    """Send email with CSV attachment via configurable SMTP"""
    if not all([settings.email_sender, settings.email_password, settings.email_recipient]):
        raise HTTPException(status_code=400, detail="Email-Einstellungen unvollständig")
    
    # Get current date for filename
    current_date = datetime.now(BERLIN_TZ).strftime("%Y-%m-%d")
    
    # Create message
    msg = MIMEMultipart()
    msg['From'] = settings.email_sender
    msg['To'] = settings.email_recipient
    msg['Subject'] = f'Zeiterfassung - Alle Daten bis {current_date}'
    
    # Email body
    body = f"""Hallo,

anbei finden Sie alle Zeiterfassungsdaten aus der Datenbank (Stand: {current_date}).

Mit freundlichen Grüßen
Zeiterfassungs-System
"""
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach CSV
    csv_attachment = MIMEApplication(csv_data.encode('utf-8'), _subtype='csv')
    csv_attachment.add_header('Content-Disposition', 'attachment', filename=f'zeiterfassung_alle_{current_date}.csv')
    msg.attach(csv_attachment)
    
    # Send email via configurable SMTP
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_server,
            port=settings.smtp_port,
            start_tls=settings.use_tls,
            username=settings.email_sender,
            password=settings.email_password,
        )
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Email-Versand fehlgeschlagen: {str(e)}")


@api_router.post("/send-daily-report")
async def send_daily_report():
    """Manuell CSV-Report per Email versenden (ALLE Daten)"""
    # Get settings
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="Keine Email-Einstellungen konfiguriert")
    
    settings_obj = Settings(**settings)
    
    # Generate CSV with ALL data
    csv_data = await generate_csv_data_all()
    if not csv_data:
        raise HTTPException(status_code=404, detail="Keine Zeiterfassungsdaten in der Datenbank")
    
    # Send email
    await send_email_with_csv(settings_obj, csv_data)
    
    current_date = datetime.now(BERLIN_TZ).strftime("%Y-%m-%d")
    
    return {"message": f"CSV-Report mit allen Daten erfolgreich versendet (Stand: {current_date})", "date": current_date}


@api_router.get("/download-csv")
async def download_csv():
    """CSV-Datei mit ALLEN Daten herunterladen"""
    # Generate CSV with ALL data
    csv_data = await generate_csv_data_all()
    if not csv_data:
        raise HTTPException(status_code=404, detail="Keine Zeiterfassungsdaten in der Datenbank")
    
    current_date = datetime.now(BERLIN_TZ).strftime("%Y-%m-%d")
    
    # Return CSV as downloadable file
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=zeiterfassung_alle_{current_date}.csv"
        }
    )


@api_router.delete("/clear-database")
async def clear_database():
    """Alle Zeiterfassungsdaten löschen (nur für Admin)"""
    result = await db.time_entries.delete_many({})
    return {
        "message": f"{result.deleted_count} Zeiterfassungen gelöscht",
        "deleted_count": result.deleted_count
    }


@api_router.get("/scheduler-status")
async def get_scheduler_status():
    """Status des automatischen Email-Versands"""
    try:
        settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
        if not settings:
            return {"active": False, "message": "Keine Einstellungen vorhanden"}
        
        send_time = settings.get("send_time", "18:00")
        last_send = settings.get("last_send_date", "Noch nie")
        
        # Check if email is configured
        email_configured = all([
            settings.get("email_sender"),
            settings.get("email_password"),
            settings.get("email_recipient")
        ])
        
        # Get current time in Berlin timezone
        berlin_now = datetime.now(BERLIN_TZ)
        
        return {
            "active": scheduler.running,
            "email_configured": email_configured,
            "send_time": send_time,
            "timezone": "Europe/Berlin",
            "current_time": berlin_now.strftime("%Y-%m-%d %H:%M:%S"),
            "last_send_date": last_send,
            "next_run": "Täglich um " + send_time + " Uhr",
            "message": "Automatischer Email-Versand ist aktiv" if email_configured else "Email nicht konfiguriert"
        }
    except Exception as e:
        return {"active": False, "error": str(e)}


@api_router.get("/")
async def root():
    return {"message": "Zeiterfassungs-App API"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========== Automatic Daily Email Scheduler ==========

# Timezone für Deutschland
BERLIN_TZ = pytz.timezone('Europe/Berlin')

# Initialize scheduler
scheduler = AsyncIOScheduler(timezone=BERLIN_TZ)


async def send_daily_email_job():
    """Job für automatischen täglichen Email-Versand"""
    try:
        logger.info("Automatischer Email-Versand gestartet...")
        
        # Get settings
        settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
        if not settings:
            logger.warning("Keine Settings gefunden für automatischen Email-Versand")
            return
        
        settings_obj = Settings(**settings)
        
        # Check if email is configured
        if not all([settings_obj.email_sender, settings_obj.email_password, settings_obj.email_recipient]):
            logger.warning("Email nicht vollständig konfiguriert - überspringe automatischen Versand")
            return
        
        # Get today's date
        today = datetime.now(BERLIN_TZ).strftime("%Y-%m-%d")
        
        # Check if already sent today
        if settings_obj.last_send_date == today:
            logger.info(f"Email für {today} bereits versendet - überspringe")
            return
        
        # Generate CSV with ALL data
        csv_data = await generate_csv_data_all()
        if not csv_data:
            logger.info("Keine Zeiterfassungsdaten in Datenbank - überspringe Email-Versand")
            return
        
        # Send email
        await send_email_with_csv(settings_obj, csv_data)
        
        # Update last send date
        await db.settings.update_one(
            {"id": "settings"},
            {"$set": {"last_send_date": today}}
        )
        
        logger.info(f"Automatischer Email-Versand für {today} erfolgreich!")
        
    except Exception as e:
        logger.error(f"Fehler beim automatischen Email-Versand: {str(e)}")


async def update_scheduler_time():
    """Aktualisiert den Scheduler basierend auf den Einstellungen"""
    try:
        # Get settings
        settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
        if not settings:
            logger.warning("Keine Settings für Scheduler-Update gefunden")
            return
        
        send_time = settings.get("send_time", "18:00")
        hour, minute = send_time.split(":")
        
        # Remove existing job if any
        if scheduler.get_job('daily_email'):
            scheduler.remove_job('daily_email')
        
        # Add new job with updated time
        scheduler.add_job(
            send_daily_email_job,
            CronTrigger(hour=int(hour), minute=int(minute), timezone=BERLIN_TZ),
            id='daily_email',
            replace_existing=True
        )
        
        logger.info(f"Scheduler aktualisiert: Täglicher Email-Versand um {send_time} Uhr (Europe/Berlin)")
        
    except Exception as e:
        logger.error(f"Fehler beim Scheduler-Update: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """App-Start: Initialisiere Scheduler"""
    logger.info("Starte Anwendung...")
    
    # Initialize users
    try:
        await init_users()
    except:
        pass
    
    # Start scheduler
    scheduler.start()
    logger.info("Scheduler gestartet")
    
    # Set initial schedule
    await update_scheduler_time()
    
    logger.info("Anwendung bereit!")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    scheduler.shutdown()
    logger.info("Anwendung beendet")
