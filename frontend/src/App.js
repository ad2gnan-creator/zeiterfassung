import { useState, useEffect } from 'react';
import '@/App.css';

// Config
import { API } from './config/api';

// Hooks
import { useAuth, useEmployees, useSettings, useDeviceType, useMessage } from './hooks';

// Views
import { LoginScreen, TerminalView, AdminView, SettingsView, BetriebsleiterView, ResetPasswordView } from './components/views';

// Modals
import { PasswordModal, EditEmployeeModal } from './components/modals';

function App() {
  const [view, setView] = useState('terminal');
  const [resetToken, setResetToken] = useState(null);

  // NFC/QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Device type detection
  const deviceType = useDeviceType();

  // Message toast
  const { message, showMessage } = useMessage();

  // Check for reset token in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;
    
    if (path === '/reset-password' && token) {
      setResetToken(token);
    }
  }, []);

  // Handle reset password completion
  const handleResetComplete = () => {
    setResetToken(null);
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');
  };

  // Auth hook
  const {
    isAuthenticated,
    currentUser,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    loading: authLoading,
    showPasswordModal,
    setShowPasswordModal,
    passwordData,
    setPasswordData,
    handleLogin,
    handleLogout,
    handlePasswordChange,
    handleRequestAdminReset,
    handleResetUserPassword
  } = useAuth(showMessage);

  // Employees hook
  const {
    employees,
    loading: employeesLoading,
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
  } = useEmployees(showMessage);

  // Settings hook
  const {
    settings,
    setSettings,
    loading: settingsLoading,
    loadSettings,
    handleSaveSettings,
    handleDownloadCSV,
    handleClearDatabase,
    handleDownloadBackup,
    handleRestoreBackup,
    handleTestEmail
  } = useSettings(showMessage);

  // Combined loading state
  const loading = authLoading || employeesLoading || settingsLoading;

  // Load data on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadEmployees();
      loadSettings();
      
      // Setze die Standard-View basierend auf der Rolle
      if (currentUser && currentUser.role === 'betriebsleiter') {
        setView('betriebsleiter');
      }
    }
  }, [isAuthenticated, loadEmployees, loadSettings, currentUser]);

  const handleNavigate = (targetView) => {
    if (targetView === 'terminal') {
      setView('terminal');
      setSelectedEmployee(null);
    } else if (targetView === 'betriebsleiter') {
      if (currentUser && (currentUser.role === 'betriebsleiter' || currentUser.role === 'admin')) {
        setView('betriebsleiter');
      } else {
        showMessage('Nur Betriebsleiter und Administrator haben Zugriff', 'error');
      }
    } else if (targetView === 'admin' || targetView === 'settings') {
      if (currentUser && currentUser.role === 'admin') {
        setView(targetView);
      } else {
        showMessage('Nur Administrator hat Zugriff', 'error');
      }
    }
  };

  // NFC Login wrapper
  const handleNFCLoginWrapper = () => {
    handleNFCLogin(setIsScanning);
  };

  // Restore backup wrapper
  const handleRestoreBackupWrapper = (event) => {
    handleRestoreBackup(event, loadEmployees);
  };

  // Show reset password view if token is present
  if (resetToken) {
    return <ResetPasswordView token={resetToken} onComplete={handleResetComplete} />;
  }

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
                data-testid="nav-terminal-btn"
                onClick={() => handleNavigate('terminal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'terminal' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Terminal
              </button>
              {currentUser && (currentUser.role === 'betriebsleiter' || currentUser.role === 'admin') && (
                <button
                  data-testid="nav-betriebsleiter-btn"
                  onClick={() => handleNavigate('betriebsleiter')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    view === 'betriebsleiter' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Übersicht
                </button>
              )}
              {currentUser && currentUser.role === 'admin' && (
                <>
                  <button
                    data-testid="nav-admin-btn"
                    onClick={() => handleNavigate('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      view === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Verwaltung
                  </button>
                  <button
                    data-testid="nav-settings-btn"
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
                {currentUser.role === 'betriebsleiter' && ' (Betriebsleiter)'}
              </span>
              <button
                data-testid="change-password-btn"
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                🔑 Passwort ändern
              </button>
              <button
                data-testid="logout-btn"
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
          deviceType={deviceType}
          handleNFCLogin={handleNFCLoginWrapper}
          processQRLogin={processQRLogin}
          isScanning={isScanning}
          currentUser={currentUser}
          showQRScanner={showQRScanner}
          setShowQRScanner={setShowQRScanner}
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
          handleDownloadBackup={handleDownloadBackup}
          handleRestoreBackup={handleRestoreBackupWrapper}
        />}
        
        {view === 'settings' && <SettingsView 
          settings={settings}
          setSettings={setSettings}
          handleSaveSettings={handleSaveSettings}
          handleDownloadCSV={handleDownloadCSV}
          handleTestEmail={handleTestEmail}
          loading={loading}
        />}

        {view === 'betriebsleiter' && <BetriebsleiterView />}
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

export default App;
