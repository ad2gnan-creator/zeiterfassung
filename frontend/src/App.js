import { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [view, setView] = useState('terminal'); // 'terminal', 'admin', 'settings'
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Admin form state
  const [newEmployee, setNewEmployee] = useState({
    personalnummer: '',
    vorname: '',
    nachname: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    email_sender: '',
    email_password: '',
    email_recipient: '',
    send_time: '18:00'
  });

  useEffect(() => {
    loadEmployees();
    loadSettings();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  };

  const handleTimeEntry = async (buttonType) => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      await axios.post(`${API}/time-entries`, {
        personalnummer: selectedEmployee.personalnummer,
        button_type: buttonType
      });
      
      showMessage(`${buttonType} erfasst für ${selectedEmployee.vorname} ${selectedEmployee.nachname}`);
      setSelectedEmployee(null);
    } catch (error) {
      showMessage('Fehler beim Erfassen der Zeit', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/employees`, newEmployee);
      showMessage('Mitarbeiter erfolgreich angelegt!');
      setNewEmployee({ personalnummer: '', vorname: '', nachname: '' });
      loadEmployees();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler beim Anlegen', 'error');
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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      showMessage('Einstellungen gespeichert!');
    } catch (error) {
      showMessage('Fehler beim Speichern', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8 items-center">
              <h1 className="text-2xl font-bold text-indigo-600">⏱️ Zeiterfassung</h1>
              <button
                data-testid="nav-terminal"
                onClick={() => { setView('terminal'); setSelectedEmployee(null); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'terminal'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Terminal
              </button>
              <button
                data-testid="nav-admin"
                onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Verwaltung
              </button>
              <button
                data-testid="nav-settings"
                onClick={() => setView('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'settings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Einstellungen
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white font-medium animate-fade-in`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'terminal' && <TerminalView 
          employees={employees}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          handleTimeEntry={handleTimeEntry}
          loading={loading}
        />}
        
        {view === 'admin' && <AdminView 
          employees={employees}
          newEmployee={newEmployee}
          setNewEmployee={setNewEmployee}
          handleAddEmployee={handleAddEmployee}
          handleDeleteEmployee={handleDeleteEmployee}
          loading={loading}
        />}
        
        {view === 'settings' && <SettingsView 
          settings={settings}
          setSettings={setSettings}
          handleSaveSettings={handleSaveSettings}
          loading={loading}
        />}
      </div>
    </div>
  );
}

// Terminal View Component
function TerminalView({ employees, selectedEmployee, setSelectedEmployee, handleTimeEntry, loading }) {
  if (selectedEmployee) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {selectedEmployee.vorname} {selectedEmployee.nachname}
            </h2>
            <p className="text-gray-500">Personalnummer: {selectedEmployee.personalnummer}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <button
              data-testid="btn-arbeitsbeginn"
              onClick={() => handleTimeEntry('Arbeitsbeginn')}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              ▶️ Arbeitsbeginn
            </button>
            <button
              data-testid="btn-pause"
              onClick={() => handleTimeEntry('Pause')}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              ⏸️ Pause
            </button>
            <button
              data-testid="btn-pausenende"
              onClick={() => handleTimeEntry('Pausenende')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              ⏯️ Pausenende
            </button>
            <button
              data-testid="btn-ende"
              onClick={() => handleTimeEntry('Ende')}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              ⏹️ Ende
            </button>
          </div>

          <button
            data-testid="btn-cancel"
            onClick={() => setSelectedEmployee(null)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Mitarbeiter auswählen
        </h2>
        
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Keine Mitarbeiter vorhanden.</p>
            <p className="text-gray-400 mt-2">Bitte legen Sie zuerst Mitarbeiter in der Verwaltung an.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <button
                key={emp.id}
                data-testid={`employee-${emp.personalnummer}`}
                onClick={() => setSelectedEmployee(emp)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-6 px-6 rounded-xl shadow-lg transform transition hover:scale-105 text-left"
              >
                <div className="text-xl font-bold">{emp.vorname} {emp.nachname}</div>
                <div className="text-indigo-100 mt-1">Nr: {emp.personalnummer}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Admin View Component
function AdminView({ employees, newEmployee, setNewEmployee, handleAddEmployee, handleDeleteEmployee, loading }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Employee Form */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Neuer Mitarbeiter</h2>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personalnummer *
              </label>
              <input
                data-testid="input-personalnummer"
                type="text"
                required
                value={newEmployee.personalnummer}
                onChange={(e) => setNewEmployee({ ...newEmployee, personalnummer: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="z.B. 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorname *
              </label>
              <input
                data-testid="input-vorname"
                type="text"
                required
                value={newEmployee.vorname}
                onChange={(e) => setNewEmployee({ ...newEmployee, vorname: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="z.B. Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nachname *
              </label>
              <input
                data-testid="input-nachname"
                type="text"
                required
                value={newEmployee.nachname}
                onChange={(e) => setNewEmployee({ ...newEmployee, nachname: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="z.B. Mustermann"
              />
            </div>
            <button
              data-testid="btn-add-employee"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Wird gespeichert...' : 'Mitarbeiter anlegen'}
            </button>
          </form>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Mitarbeiter ({employees.length})
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {employees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Keine Mitarbeiter vorhanden</p>
            ) : (
              employees.map((emp) => (
                <div
                  key={emp.id}
                  data-testid={`employee-item-${emp.personalnummer}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      {emp.vorname} {emp.nachname}
                    </div>
                    <div className="text-sm text-gray-500">Nr: {emp.personalnummer}</div>
                  </div>
                  <button
                    data-testid={`btn-delete-${emp.personalnummer}`}
                    onClick={() => handleDeleteEmployee(emp.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings View Component
function SettingsView({ settings, setSettings, handleSaveSettings, loading }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Email-Einstellungen</h2>
        <p className="text-gray-600 mb-6">Konfigurieren Sie hier den automatischen CSV-Versand per Email.</p>
        
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gmail-Absender-Adresse
            </label>
            <input
              data-testid="input-email-sender"
              type="email"
              value={settings.email_sender || ''}
              onChange={(e) => setSettings({ ...settings, email_sender: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="ihre-email@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gmail App-Passwort
            </label>
            <input
              data-testid="input-email-password"
              type="password"
              value={settings.email_password || ''}
              onChange={(e) => setSettings({ ...settings, email_password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="xxxx xxxx xxxx xxxx"
            />
            <p className="text-sm text-gray-500 mt-1">
              Erstellen Sie ein App-Passwort in Ihrem Google-Konto (Sicherheit → 2-Faktor-Auth → App-Passwörter)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empfänger-Email-Adresse
            </label>
            <input
              data-testid="input-email-recipient"
              type="email"
              value={settings.email_recipient || ''}
              onChange={(e) => setSettings({ ...settings, email_recipient: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="empfaenger@firma.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tägliche Versandzeit
            </label>
            <input
              data-testid="input-send-time"
              type="time"
              value={settings.send_time || '18:00'}
              onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            data-testid="btn-save-settings"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Hinweis</h3>
          <p className="text-sm text-blue-800">
            Der automatische CSV-Versand wird täglich zur angegebenen Zeit durchgeführt. 
            Die CSV-Datei enthält alle Zeiterfassungen des aktuellen Tages.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
