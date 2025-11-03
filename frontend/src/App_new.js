import { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [view, setView] = useState('terminal');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // {username, role}
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [loginUsername, setLoginUsername] = useState('user');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Employee management
  const [newEmployee, setNewEmployee] = useState({
    personalnummer: '',
    vorname: '',
    nachname: '',
    abteilung: 'Holz'
  });
  const [editEmployee, setEditEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    email_sender: '',
    email_password: '',
    email_recipient: '',
    send_time: '18:00',
    admin_reset_email: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadEmployees();
      loadSettings();
    }
  }, [isAuthenticated]);

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

  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  // Auth functions
  const handleLogin = async () => {
    setLoginError('');
    try {
      const response = await axios.post(`${API}/login`, {
        username: loginUsername,
        password: loginPassword
      });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        setCurrentUser({ username: response.data.username, role: response.data.role });
        setShowLoginModal(false);
        setLoginPassword('');
        showMessage(`Willkommen, ${response.data.username}!`);
      } else {
        setLoginError(response.data.message || 'Login fehlgeschlagen');
      }
    } catch (error) {
      setLoginError('Fehler beim Login');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLoginModal(true);
    setView('terminal');
    showMessage('Abgemeldet');
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('Passwörter stimmen nicht überein', 'error');
      return;
    }
    if (passwordData.newPassword.length < 3) {
      showMessage('Passwort muss mindestens 3 Zeichen haben', 'error');
      return;
    }

    try {
      await axios.post(`${API}/change-password`, {
        username: currentUser.username,
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword
      });
      showMessage('Passwort erfolgreich geändert!');
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler beim Ändern', 'error');
    }
  };

  const handleRequestAdminReset = async () => {
    try {
      const response = await axios.post(`${API}/request-password-reset`, {
        username: 'administrator'
      });
      showMessage(response.data.message);
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler', 'error');
    }
  };

  const handleResetUserPassword = async () => {
    if (!window.confirm('User-Passwort auf "user" zurücksetzen?')) return;
    try {
      await axios.post(`${API}/reset-user-password`);
      showMessage('User-Passwort zurückgesetzt');
    } catch (error) {
      showMessage('Fehler beim Zurücksetzen', 'error');
    }
  };

  // Time entry
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
      showMessage('Fehler beim Erfassen', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Employee management
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/employees`, newEmployee);
      showMessage('Mitarbeiter angelegt!');
      setNewEmployee({ personalnummer: '', vorname: '', nachname: '', abteilung: 'Holz' });
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
        abteilung: editEmployee.abteilung
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

  // Settings
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
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/download-csv?date=${today}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `zeiterfassung_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showMessage('CSV heruntergeladen!');
    } catch (error) {
      showMessage('Keine Daten vorhanden', 'error');
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

  const handleNavigate = (targetView) => {
    if (targetView === 'terminal') {
      setView('terminal');
      setSelectedEmployee(null);
    } else if (targetView === 'admin' || targetView === 'settings') {
      if (currentUser && currentUser.role === 'admin') {
        setView(targetView);
      } else {
        showMessage('Nur Administrator hat Zugriff', 'error');
      }
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen 
      loginUsername={loginUsername}
      setLoginUsername={setLoginUsername}
      loginPassword={loginPassword}
      setLoginPassword={setLoginPassword}
      loginError={loginError}
      handleLogin={handleLogin}
      loading={loading}
      handleRequestAdminReset={handleRequestAdminReset}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8 items-center">
              <h1 className="text-2xl font-bold text-indigo-600">⏱️ Zeiterfassung</h1>
              <button
                onClick={() => handleNavigate('terminal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'terminal' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Terminal
              </button>
              {currentUser && currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => handleNavigate('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      view === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Verwaltung
                  </button>
                  <button
                    onClick={() => handleNavigate('settings')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      view === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Einstellungen
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                👤 {currentUser.username}
                {currentUser.role === 'admin' && ' (Admin)'}
              </span>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                🔑 Passwort ändern
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Abmelden
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
          handleEditEmployee={handleEditEmployee}
          handleDeleteEmployee={handleDeleteEmployee}
          loading={loading}
          currentUser={currentUser}
          handleResetUserPassword={handleResetUserPassword}
        />}
        
        {view === 'settings' && <SettingsView 
          settings={settings}
          setSettings={setSettings}
          handleSaveSettings={handleSaveSettings}
          handleDownloadCSV={handleDownloadCSV}
          handleTestEmail={handleTestEmail}
          loading={loading}
        />}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordModal
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          handlePasswordChange={handlePasswordChange}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
          }}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editEmployee && (
        <EditEmployeeModal
          editEmployee={editEmployee}
          setEditEmployee={setEditEmployee}
          handleUpdateEmployee={handleUpdateEmployee}
          onClose={() => {
            setShowEditModal(false);
            setEditEmployee(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}

// Login Screen Component
function LoginScreen({ loginUsername, setLoginUsername, loginPassword, setLoginPassword, loginError, handleLogin, loading, handleRequestAdminReset }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">⏱️ Zeiterfassung</h2>
        <p className="text-gray-600 mb-8 text-center">Bitte melden Sie sich an</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
            <select
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="user">User (Mitarbeiter)</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Passwort eingeben"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Anmeldung...' : 'Anmelden'}
          </button>

          {loginUsername === 'administrator' && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Administrator-Passwort vergessen?</p>
              <button
                onClick={handleRequestAdminReset}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Reset-Link per Email anfordern
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Standard-Zugangsdaten:</strong><br/>
            User: user / user<br/>
            Admin: administrator / admin
          </p>
        </div>
      </div>
    </div>
  );
}

// Password Change Modal
function PasswordModal({ passwordData, setPasswordData, handlePasswordChange, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Passwort ändern</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Altes Passwort</label>
            <input
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Neues Passwort</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passwort bestätigen</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              onClick={handlePasswordChange}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ich werde die Komponenten in einer separaten Nachricht fortsetzen, da die Datei zu groß ist...
