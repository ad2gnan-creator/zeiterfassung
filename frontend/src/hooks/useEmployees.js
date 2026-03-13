import { useState, useCallback } from 'react';
import axios from 'axios';
import { API } from '../config/api';

export function useEmployees(showMessage) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // New employee form
  const [newEmployee, setNewEmployee] = useState({
    personalnummer: '',
    vorname: '',
    nachname: '',
    abteilung: 'Holz',
    nfc_chip_id: '',
    qr_code: ''
  });
  
  // Edit employee
  const [editEmployee, setEditEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      // Sort employees by Personalnummer
      const sortedEmployees = response.data.sort((a, b) => {
        return a.personalnummer.localeCompare(b.personalnummer, undefined, { numeric: true });
      });
      setEmployees(sortedEmployees);
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
    }
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/employees`, newEmployee);
      showMessage('Mitarbeiter angelegt!');
      setNewEmployee({ 
        personalnummer: '', 
        vorname: '', 
        nachname: '', 
        abteilung: 'Holz', 
        nfc_chip_id: '', 
        qr_code: '' 
      });
      loadEmployees();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (emp) => {
    setEditEmployee({ ...emp });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/employees/${editEmployee.id}`, {
        personalnummer: editEmployee.personalnummer,
        vorname: editEmployee.vorname,
        nachname: editEmployee.nachname,
        abteilung: editEmployee.abteilung,
        nfc_chip_id: editEmployee.nfc_chip_id || '',
        qr_code: editEmployee.qr_code || ''
      });
      showMessage('Mitarbeiter aktualisiert!');
      setShowEditModal(false);
      setEditEmployee(null);
      loadEmployees();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/employees/${id}`);
      showMessage('Mitarbeiter gelöscht');
      loadEmployees();
    } catch (error) {
      showMessage('Fehler beim Löschen', 'error');
    }
  };

  // Time entry
  const handleTimeEntry = async (buttonType) => {
    if (!selectedEmployee) return;
    setLoading(true);
    try {
      // Erfasse die lokale Zeit vom Gerät
      const now = new Date();
      const datum = now.toLocaleDateString('sv-SE'); // Format: YYYY-MM-DD
      const uhrzeit = now.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      });
      
      await axios.post(`${API}/time-entries`, {
        personalnummer: selectedEmployee.personalnummer,
        button_type: buttonType,
        datum: datum,
        uhrzeit: uhrzeit
      });
      showMessage(`${buttonType} erfasst für ${selectedEmployee.vorname} ${selectedEmployee.nachname}`);
      setSelectedEmployee(null); // Auto-logout after button press
    } catch (error) {
      showMessage('Fehler beim Erfassen', 'error');
    } finally {
      setLoading(false);
    }
  };

  // NFC Login for Android
  const handleNFCLogin = async (setIsScanning) => {
    if (!('NDEFReader' in window)) {
      showMessage('NFC wird auf diesem Gerät nicht unterstützt. Bitte verwenden Sie Chrome auf Android.', 'error');
      return;
    }

    setIsScanning(true);
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      
      showMessage('NFC-Reader aktiviert. Bitte halten Sie den Chip an das Gerät.');
      
      ndef.addEventListener('reading', async ({ serialNumber }) => {
        setIsScanning(false);
        try {
          const response = await axios.post(`${API}/nfc-login`, {
            nfc_chip_id: serialNumber
          });
          
          if (response.data.success) {
            setSelectedEmployee(response.data.employee);
            showMessage(`Willkommen ${response.data.employee.vorname} ${response.data.employee.nachname}!`);
          } else {
            showMessage(response.data.message || 'NFC-Login fehlgeschlagen', 'error');
          }
        } catch (error) {
          showMessage('Fehler beim NFC-Login', 'error');
        }
      });
    } catch (error) {
      setIsScanning(false);
      showMessage('NFC-Scan konnte nicht gestartet werden: ' + error.message, 'error');
    }
  };

  // QR Code Login for iOS
  const processQRLogin = async (qrCode) => {
    console.log("📱 processQRLogin aufgerufen mit:", qrCode);
    
    if (!qrCode) {
      console.log("❌ Kein QR-Code vorhanden");
      return;
    }
    
    if (qrCode.length < 8) {
      console.log("❌ QR-Code zu kurz:", qrCode.length);
      showMessage('QR-Code muss mindestens 8 Zeichen lang sein', 'error');
      return;
    }

    console.log("✅ QR-Code gültig, sende Login-Request...");
    setLoading(true);
    try {
      const response = await axios.post(`${API}/qr-login`, {
        qr_code: qrCode
      });
      
      console.log("📡 Server-Antwort:", response.data);
      
      if (response.data.success) {
        console.log("✅ Login erfolgreich:", response.data.employee);
        setSelectedEmployee(response.data.employee);
        showMessage(`Willkommen ${response.data.employee.vorname} ${response.data.employee.nachname}!`);
      } else {
        console.log("❌ Login fehlgeschlagen:", response.data.message);
        showMessage(response.data.message || 'QR-Login fehlgeschlagen', 'error');
      }
    } catch (error) {
      console.error("❌ Fehler beim QR-Login:", error);
      showMessage('Fehler beim QR-Login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    employees,
    loading,
    selectedEmployee,
    setSelectedEmployee,
    newEmployee,
    setNewEmployee,
    editEmployee,
    setEditEmployee,
    showEditModal,
    setShowEditModal,
    loadEmployees,
    handleAddEmployee,
    handleEditEmployee,
    handleUpdateEmployee,
    handleDeleteEmployee,
    handleTimeEntry,
    handleNFCLogin,
    processQRLogin
  };
}
