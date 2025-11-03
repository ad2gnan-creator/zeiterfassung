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

  // Login state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pendingView, setPendingView] = useState(null);

  // Admin form state
  const [newEmployee, setNewEmployee] = useState({
    personalnummer: '',
    vorname: '',
    nachname: '',
    abteilung: 'Holz'
  });

  // Edit employee state
  const [editEmployee, setEditEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    email_sender: '',
    email_password: '',
    email_recipient: '',
    send_time: '18:00',
    admin_password: ''
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
      setNewEmployee({ personalnummer: '', vorname: '', nachname: '', abteilung: 'Holz' });
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

  const handleEditEmployee = (employee) => {
    setEditEmployee({ ...employee });
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
      showMessage('Mitarbeiter erfolgreich aktualisiert!');
      setShowEditModal(false);
      setEditEmployee(null);
      loadEmployees();
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Fehler beim Aktualisieren', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (targetView) => {
    if (targetView === 'terminal') {
      setView('terminal');
      setSelectedEmployee(null);
    } else if (targetView === 'admin' || targetView === 'settings') {
      if (isAuthenticated) {
        setView(targetView);
      } else {
        setPendingView(targetView);
        setShowLoginModal(true);
      }
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    try {
      const response = await axios.post(`${API}/verify-password`, {
        password: loginPassword
      });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        setShowLoginModal(false);
        setLoginPassword('');
        if (pendingView) {
          setView(pendingView);
          setPendingView(null);
        }
        showMessage('Login erfolgreich!');
      } else {
        setLoginError('Falsches Passwort');
      }
    } catch (error) {
      setLoginError('Fehler beim Login');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView('terminal');
    showMessage('Abgemeldet');
  };

  const handleResetPassword = async () => {
    if (window.confirm('Passwort wirklich auf "admin" zurücksetzen?')) {
      try {
        await axios.post(`${API}/reset-password`);
        showMessage('Passwort wurde auf "admin" zurückgesetzt');
        setIsAuthenticated(false);
        setView('terminal');
      } catch (error) {
        showMessage('Fehler beim Zurücksetzen', 'error');
      }
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      showMessage('Einstellungen gespeichert!');
      loadSettings();
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
                onClick={() => handleNavigate('terminal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'terminal'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Terminal
              </button>
              {isAuthenticated && (
                <>
                  <button
                    data-testid="nav-admin"
                    onClick={() => handleNavigate('admin')}
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
                    onClick={() => handleNavigate('settings')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      view === 'settings'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Einstellungen
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <button
                  data-testid="btn-logout"
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Abmelden
                </button>
              ) : (
                <button
                  data-testid="btn-login"
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  🔒 Admin-Login
                </button>
              )}
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
          handleEditEmployee={handleEditEmployee}
          loading={loading}
        />}
        
        {view === 'settings' && <SettingsView 
          settings={settings}
          setSettings={setSettings}
          handleSaveSettings={handleSaveSettings}
          loading={loading}
        />}
      </div>

      {/* Edit Modal */}
      {showEditModal && editEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Mitarbeiter bearbeiten</h3>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personalnummer *
                </label>
                <input
                  data-testid="edit-input-personalnummer"
                  type="text"
                  required
                  value={editEmployee.personalnummer}
                  onChange={(e) => setEditEmployee({ ...editEmployee, personalnummer: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorname *
                </label>
                <input
                  data-testid="edit-input-vorname"
                  type="text"
                  required
                  value={editEmployee.vorname}
                  onChange={(e) => setEditEmployee({ ...editEmployee, vorname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachname *
                </label>
                <input
                  data-testid="edit-input-nachname"
                  type="text"
                  required
                  value={editEmployee.nachname}
                  onChange={(e) => setEditEmployee({ ...editEmployee, nachname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abteilung *
                </label>
                <select
                  data-testid="edit-input-abteilung"
                  required
                  value={editEmployee.abteilung}
                  onChange={(e) => setEditEmployee({ ...editEmployee, abteilung: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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
                  onClick={() => {
                    setShowEditModal(false);
                    setEditEmployee(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  data-testid="btn-update-employee"
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Wird gespeichert...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Admin-Login</h3>
            <p className="text-gray-600 mb-6">Bitte geben Sie das Admin-Passwort ein.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passwort
                </label>
                <input
                  data-testid="login-password-input"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Passwort eingeben"
                  autoFocus
                />
                {loginError && (
                  <p className="text-red-500 text-sm mt-2">{loginError}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginPassword('');
                    setLoginError('');
                    setPendingView(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  data-testid="btn-submit-login"
                  onClick={handleLogin}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Anmelden
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Passwort vergessen?</p>
                <button
                  data-testid="btn-reset-password"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginPassword('');
                    setLoginError('');
                    handleResetPassword();
                  }}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Passwort zurücksetzen (auf "admin")
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Terminal View Component
function TerminalView({ employees, selectedEmployee, setSelectedEmployee, handleTimeEntry, loading }) {
  const [activeTab, setActiveTab] = useState('Holz');
  const departments = ['Holz', 'Kunststoff', 'Montage', 'Verwaltung'];
  
  // Filter employees by department
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
        
        {/* Department Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              data-testid={`tab-${dept}`}
              onClick={() => setActiveTab(dept)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === dept
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
        
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Keine Mitarbeiter in der Abteilung "{activeTab}".</p>
            <p className="text-gray-400 mt-2">Bitte legen Sie zuerst Mitarbeiter in der Verwaltung an.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => (
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
function AdminView({ employees, newEmployee, setNewEmployee, handleAddEmployee, handleDeleteEmployee, handleEditEmployee, loading }) {
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abteilung *
              </label>
              <select
                data-testid="input-abteilung"
                required
                value={newEmployee.abteilung}
                onChange={(e) => setNewEmployee({ ...newEmployee, abteilung: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="Holz">Holz</option>
                <option value="Kunststoff">Kunststoff</option>
                <option value="Montage">Montage</option>
                <option value="Verwaltung">Verwaltung</option>
              </select>
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
                    <div className="text-sm text-indigo-600 font-medium">{emp.abteilung}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      data-testid={`btn-edit-${emp.personalnummer}`}
                      onClick={() => handleEditEmployee(emp)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      data-testid={`btn-delete-${emp.personalnummer}`}
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
    </div>
  );
}

// Settings View Component
function SettingsView({ settings, setSettings, handleSaveSettings, loading }) {
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const handleTestEmail = async () => {
    setTestLoading(true);
    setTestMessage('');
    try {
      const response = await axios.post(`${API}/send-daily-report`);
      setTestMessage({ text: response.data.message, type: 'success' });
    } catch (error) {
      setTestMessage({ 
        text: error.response?.data?.detail || 'Fehler beim Email-Versand', 
        type: 'error' 
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/download-csv?date=${today}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `zeiterfassung_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setTestMessage({ text: 'CSV-Datei erfolgreich heruntergeladen!', type: 'success' });
      setTimeout(() => setTestMessage(''), 3000);
    } catch (error) {
      setTestMessage({ 
        text: error.response?.data?.detail || 'Keine Daten für heute vorhanden', 
        type: 'error' 
      });
      setTimeout(() => setTestMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Einstellungen</h2>
        <p className="text-gray-600 mb-6">Konfigurieren Sie hier die App-Einstellungen.</p>
        
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Admin Password Section */}
          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔒 Admin-Passwort</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Admin-Passwort
              </label>
              <input
                data-testid="input-admin-password"
                type="password"
                value={settings.admin_password || ''}
                onChange={(e) => setSettings({ ...settings, admin_password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Neues Passwort eingeben (leer lassen für keine Änderung)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leer lassen, wenn Sie das Passwort nicht ändern möchten.
              </p>
            </div>
          </div>

          {/* Email Settings Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📧 Email-Einstellungen</h3>
            
            <div className="space-y-4">
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
            </div>
          </div>

          <button
            data-testid="btn-save-settings"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Wird gespeichert...' : 'Alle Einstellungen speichern'}
          </button>
        </form>

        {/* CSV Download Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📥 CSV-Datei herunterladen</h3>
          <button
            data-testid="btn-download-csv"
            onClick={handleDownloadCSV}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📄 Heutige CSV-Datei herunterladen
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Lädt die Zeiterfassungen des heutigen Tages als CSV-Datei herunter (ohne Email-Versand).
          </p>
        </div>

        {/* Test Email Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📧 Email-Versand testen</h3>
          <button
            data-testid="btn-test-email"
            onClick={handleTestEmail}
            disabled={testLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testLoading ? 'Wird gesendet...' : 'Tages-Report jetzt senden'}
          </button>
          {testMessage && (
            <div className={`mt-3 p-3 rounded-lg ${
              testMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {testMessage.text}
            </div>
          )}
        </div>

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
