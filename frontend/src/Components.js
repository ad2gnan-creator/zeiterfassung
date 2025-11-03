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
function AdminView({ employees, newEmployee, setNewEmployee, handleAddEmployee, handleEditEmployee, handleDeleteEmployee, loading, currentUser, handleResetUserPassword }) {
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📧 Email-Einstellungen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gmail-Absender-Adresse</label>
                <input
                  type="email"
                  value={settings.email_sender || ''}
                  onChange={(e) => setSettings({ ...settings, email_sender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="ihre-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gmail App-Passwort</label>
                <input
                  type="password"
                  value={settings.email_password || ''}
                  onChange={(e) => setSettings({ ...settings, email_password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="xxxx xxxx xxxx xxxx"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tägliche Versandzeit</label>
                <input
                  type="time"
                  value={settings.send_time || '18:00'}
                  onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
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

        {/* CSV Download */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">📥 CSV-Datei herunterladen</h3>
          <button
            onClick={handleDownloadCSV}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📄 Heutige CSV-Datei herunterladen
          </button>
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
