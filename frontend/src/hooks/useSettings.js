import { useState, useCallback } from 'react';
import axios from 'axios';
import { API } from '../config/api';

export function useSettings(showMessage) {
  const [settings, setSettings] = useState({
    email_sender: '',
    email_password: '',
    email_recipient: '',
    smtp_server: 'mail.gmx.net',
    smtp_port: 587,
    use_tls: true,
    send_time: '18:00',
    admin_reset_email: ''
  });
  const [loading, setLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      showMessage('Einstellungen gespeichert!');
      loadSettings();
    } catch (error) {
      showMessage('Fehler', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await axios.get(`${API}/download-csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `zeiterfassung_alle_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showMessage('CSV mit allen Daten heruntergeladen!');
    } catch (error) {
      showMessage('Keine Daten vorhanden', 'error');
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('⚠️ ACHTUNG: Alle Zeiterfassungsdaten werden unwiderruflich gelöscht!\n\nMöchten Sie fortfahren?')) return;
    
    // Double confirmation
    if (!window.confirm('Sind Sie WIRKLICH sicher? Diese Aktion kann nicht rückgängig gemacht werden!')) return;
    
    try {
      const response = await axios.delete(`${API}/clear-database`);
      showMessage(response.data.message);
    } catch (error) {
      showMessage('Fehler beim Löschen', 'error');
    }
  };

  const handleDownloadBackup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/backup`);
      
      // JSON als Datei herunterladen
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Dateiname mit Datum
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      link.download = `zeiterfassung-backup-${dateStr}_${timeStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const stats = response.data.statistics;
      showMessage(`Backup erstellt: ${stats.total_employees} Mitarbeiter, ${stats.total_time_entries} Zeiteinträge`);
    } catch (error) {
      showMessage('Fehler beim Erstellen des Backups', 'error');
      console.error('Backup-Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (event, loadEmployees) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!window.confirm('⚠️ ACHTUNG: Alle aktuellen Daten werden durch das Backup ersetzt!\n\nMöchten Sie fortfahren?')) {
      event.target.value = '';
      return;
    }
    
    setLoading(true);
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);
      
      // Validiere Backup-Format
      if (!backupData.data || !backupData.backup_version) {
        throw new Error('Ungültiges Backup-Format');
      }
      
      const response = await axios.post(`${API}/restore`, backupData);
      
      const restored = response.data.restored;
      showMessage(`Backup wiederhergestellt: ${restored.employees} Mitarbeiter, ${restored.time_entries} Zeiteinträge`);
      
      // Daten neu laden
      if (loadEmployees) {
        await loadEmployees();
      }
      
    } catch (error) {
      if (error.message === 'Ungültiges Backup-Format') {
        showMessage('Ungültige Backup-Datei', 'error');
      } else {
        showMessage('Fehler beim Wiederherstellen des Backups', 'error');
      }
      console.error('Restore-Fehler:', error);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/send-daily-report`);
      showMessage(response.data.message);
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    setSettings,
    loading,
    loadSettings,
    handleSaveSettings,
    handleDownloadCSV,
    handleClearDatabase,
    handleDownloadBackup,
    handleRestoreBackup,
    handleTestEmail
  };
}
