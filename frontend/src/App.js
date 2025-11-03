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
    smtp_server: 'mail.gmx.net',
    smtp_port: 587,
    use_tls: true,
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
          handleClearDatabase={handleClearDatabase}
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

// Terminal View Component
function TerminalView({ employees, selectedEmployee, setSelectedEmployee, handleTimeEntry, loading }) {
  const [activeTab, setActiveTab] = useState('Holz');
  const departments = ['Holz', 'Kunststoff', 'Montage', 'Verwaltung'];
  const filteredEmployees = employees.filter(emp => emp.abteilung === activeTab);
  
  if (selectedEmployee) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {selectedEmployee.vorname} {selectedEmployee.nachname}
            </h2>
            <p className="text-gray-500">Personalnummer: {selectedEmployee.personalnummer}</p>
            <p className="text-indigo-600 font-semibold mt-1">{selectedEmployee.abteilung}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <button
              onClick={() => handleTimeEntry('Arbeitsbeginn')}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ▶️ Arbeitsbeginn
            </button>
            <button
              onClick={() => handleTimeEntry('Pause')}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ⏸️ Pause
            </button>
            <button
              onClick={() => handleTimeEntry('Pausenende')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ⏯️ Pausenende
            </button>
            <button
              onClick={() => handleTimeEntry('Ende')}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ⏹️ Ende
            </button>
          </div>

          <button
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Mitarbeiter auswählen</h2>
        
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveTab(dept)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === dept ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
        
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Keine Mitarbeiter in "{activeTab}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
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
function AdminView({ employees, newEmployee, setNewEmployee, handleAddEmployee, handleEditEmployee, handleDeleteEmployee, loading, currentUser, handleResetUserPassword, handleClearDatabase }) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Employee Form */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Neuer Mitarbeiter</h2>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personalnummer *</label>
              <input
                type="text"
                required
                value={newEmployee.personalnummer}
                onChange={(e) => setNewEmployee({ ...newEmployee, personalnummer: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vorname *</label>
              <input
                type="text"
                required
                value={newEmployee.vorname}
                onChange={(e) => setNewEmployee({ ...newEmployee, vorname: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nachname *</label>
              <input
                type="text"
                required
                value={newEmployee.nachname}
                onChange={(e) => setNewEmployee({ ...newEmployee, nachname: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. Mustermann"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Abteilung *</label>
              <select
                required
                value={newEmployee.abteilung}
                onChange={(e) => setNewEmployee({ ...newEmployee, abteilung: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Holz">Holz</option>
                <option value="Kunststoff">Kunststoff</option>
                <option value="Montage">Montage</option>
                <option value="Verwaltung">Verwaltung</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Wird gespeichert...' : 'Mitarbeiter anlegen'}
            </button>
          </form>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mitarbeiter ({employees.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {employees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Keine Mitarbeiter vorhanden</p>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div>
                    <div className="font-semibold text-gray-800">{emp.vorname} {emp.nachname}</div>
                    <div className="text-sm text-gray-500">Nr: {emp.personalnummer}</div>
                    <div className="text-sm text-indigo-600 font-medium">{emp.abteilung}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditEmployee(emp)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Password Reset */}
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🔑 Benutzer-Verwaltung</h2>
        <p className="text-gray-600 mb-4">Als Administrator können Sie das User-Passwort zurücksetzen.</p>
        <button
          onClick={handleResetUserPassword}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          User-Passwort auf "user" zurücksetzen
        </button>
      </div>

      {/* Database Management */}
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🗄️ Datenbank-Verwaltung</h2>
        <p className="text-gray-600 mb-4">
          ⚠️ <strong>Warnung:</strong> Das Löschen der Datenbank entfernt ALLE Zeiterfassungsdaten unwiderruflich!
          <br/>Stellen Sie sicher, dass Sie vorher eine CSV-Datei heruntergeladen haben.
        </p>
        <button
          data-testid="btn-clear-database"
          onClick={handleClearDatabase}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          🗑️ Alle Zeiterfassungsdaten löschen
        </button>
      </div>
    </div>
  );
}

// Settings View Component
function SettingsView({ settings, setSettings, handleSaveSettings, handleDownloadCSV, handleTestEmail, loading }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Einstellungen</h2>
        <p className="text-gray-600 mb-6">Konfigurieren Sie hier die App-Einstellungen.</p>
        
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Admin Reset Email */}
          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔑 Administrator-Passwort-Reset</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email-Adresse für Admin-Reset
              </label>
              <input
                type="email"
                value={settings.admin_reset_email || ''}
                onChange={(e) => setSettings({ ...settings, admin_reset_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="admin@firma.de"
              />
              <p className="text-sm text-gray-500 mt-1">
                An diese Adresse wird der Passwort-Reset-Link gesendet.
              </p>
            </div>
          </div>

          {/* Email Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📧 Email-Einstellungen (Flexibel)</h3>
            <div className="space-y-4">
              {/* SMTP Server Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Server *</label>
                  <input
                    type="text"
                    value={settings.smtp_server || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="mail.gmx.net"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    GMX: mail.gmx.net | Outlook: smtp.office365.com | Web.de: smtp.web.de
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port *</label>
                  <input
                    type="number"
                    value={settings.smtp_port || 587}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="587"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Standard: 587 (TLS) oder 465 (SSL)
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.use_tls || false}
                    onChange={(e) => setSettings({ ...settings, use_tls: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">TLS/STARTTLS verwenden (empfohlen)</span>
                </label>
                <p className="text-sm text-gray-500 mt-1 ml-7">
                  Die meisten Provider benötigen TLS für Port 587
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email-Adresse (Absender) *</label>
                <input
                  type="email"
                  value={settings.email_sender || ''}
                  onChange={(e) => setSettings({ ...settings, email_sender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="ihre-email@provider.de"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ihre vollständige Email-Adresse
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passwort *</label>
                <input
                  type="password"
                  value={settings.email_password || ''}
                  onChange={(e) => setSettings({ ...settings, email_password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ihr Email-Passwort"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bei Gmail: App-Passwort | Bei GMX/Web.de/Outlook: normales Passwort
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empfänger-Email-Adresse</label>
                <input
                  type="email"
                  value={settings.email_recipient || ''}
                  onChange={(e) => setSettings({ ...settings, email_recipient: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="empfaenger@firma.de"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tägliche Versandzeit (Europe/Berlin)</label>
                <input
                  type="time"
                  value={settings.send_time || '18:00'}
                  onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ⏰ Der automatische CSV-Versand erfolgt täglich zur eingestellten Zeit (Deutsche Zeit)
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert...' : 'Alle Einstellungen speichern'}
          </button>
        </form>

        {/* Scheduler Status Info */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">✅ Automatischer Email-Versand aktiv</h3>
          <p className="text-sm text-green-800">
            Der Server versendet automatisch jeden Tag um <strong>{settings.send_time || '18:00'} Uhr</strong> (Deutsche Zeit) 
            eine Email mit <strong>ALLEN Zeiterfassungsdaten</strong> aus der Datenbank an die konfigurierte Empfänger-Adresse.
          </p>
          <p className="text-sm text-green-700 mt-2">
            💡 Die Datenbank wird dabei <strong>NICHT</strong> geleert. Zum Löschen verwenden Sie den Button im Verwaltungsbereich.
          </p>
        </div>

        {/* CSV Download */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📥 CSV-Datei herunterladen</h3>
          <button
            onClick={handleDownloadCSV}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📄 CSV mit ALLEN Daten herunterladen
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Lädt eine CSV-Datei mit allen Zeiterfassungen aus der Datenbank herunter.
          </p>
        </div>

        {/* Test Email */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📧 Email-Versand testen</h3>
          <button
            onClick={handleTestEmail}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gesendet...' : 'Tages-Report jetzt senden'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Employee Modal
function EditEmployeeModal({ editEmployee, setEditEmployee, handleUpdateEmployee, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Mitarbeiter bearbeiten</h3>
        <form onSubmit={handleUpdateEmployee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personalnummer *</label>
            <input
              type="text"
              required
              value={editEmployee.personalnummer}
              onChange={(e) => setEditEmployee({ ...editEmployee, personalnummer: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vorname *</label>
            <input
              type="text"
              required
              value={editEmployee.vorname}
              onChange={(e) => setEditEmployee({ ...editEmployee, vorname: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nachname *</label>
            <input
              type="text"
              required
              value={editEmployee.nachname}
              onChange={(e) => setEditEmployee({ ...editEmployee, nachname: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abteilung *</label>
            <select
              required
              value={editEmployee.abteilung}
              onChange={(e) => setEditEmployee({ ...editEmployee, abteilung: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Holz">Holz</option>
              <option value="Kunststoff">Kunststoff</option>
              <option value="Montage">Montage</option>
              <option value="Verwaltung">Verwaltung</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
