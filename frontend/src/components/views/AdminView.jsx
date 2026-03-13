function AdminView({ 
  employees, 
  newEmployee, 
  setNewEmployee, 
  handleAddEmployee, 
  handleEditEmployee, 
  handleDeleteEmployee, 
  loading, 
  currentUser, 
  handleResetUserPassword, 
  handleClearDatabase, 
  handleDownloadBackup, 
  handleRestoreBackup 
}) {
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
                data-testid="new-employee-personnr"
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
                data-testid="new-employee-firstname"
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
                data-testid="new-employee-lastname"
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
                data-testid="new-employee-department"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NFC-Chip-ID (Android)</label>
              <input
                data-testid="new-employee-nfc"
                type="text"
                value={newEmployee.nfc_chip_id}
                onChange={(e) => setNewEmployee({ ...newEmployee, nfc_chip_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. 04:1A:2B:3C:4D:5E"
              />
              <p className="text-xs text-gray-500 mt-1">Optional - für NFC-Login auf Android-Tablets</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR-Code (iOS, min. 8 Zeichen)</label>
              <input
                data-testid="new-employee-qr"
                type="text"
                value={newEmployee.qr_code}
                onChange={(e) => setNewEmployee({ ...newEmployee, qr_code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. EMP12345"
                minLength="8"
              />
              <p className="text-xs text-gray-500 mt-1">Optional - für QR-Login auf iOS-Tablets (mindestens 8 Zeichen)</p>
            </div>
            <button
              data-testid="add-employee-btn"
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
                    {emp.nfc_chip_id && (
                      <div className="text-xs text-green-600 mt-1">🔹 NFC: {emp.nfc_chip_id}</div>
                    )}
                    {emp.qr_code && (
                      <div className="text-xs text-blue-600 mt-1">📱 QR: {emp.qr_code}</div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      data-testid={`edit-employee-${emp.personalnummer}`}
                      onClick={() => handleEditEmployee(emp)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      data-testid={`delete-employee-${emp.personalnummer}`}
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
          data-testid="reset-user-password-btn"
          onClick={handleResetUserPassword}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          User-Passwort auf "user" zurücksetzen
        </button>
      </div>

      {/* Database Management */}
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🗄️ Datenbank-Verwaltung</h2>
        
        {/* Backup & Restore Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💾 Backup & Wiederherstellung</h3>
          <p className="text-gray-700 mb-4 text-sm">
            Sichern Sie alle Mitarbeiter und Zeiterfassungsdaten als JSON-Datei. 
            Perfekt für Fork → Deploy → Restore Workflows.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Backup Download Button */}
            <button
              data-testid="download-backup-btn"
              onClick={handleDownloadBackup}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>📥</span>
              <span>Backup herunterladen</span>
            </button>
            
            {/* Backup Restore Button */}
            <label className="flex-1">
              <input
                data-testid="restore-backup-input"
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                disabled={loading}
                className="hidden"
              />
              <div className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-2">
                <span>📤</span>
                <span>Backup wiederherstellen</span>
              </div>
            </label>
          </div>
          
          <p className="text-xs text-gray-600 mt-3">
            ℹ️ Das Backup enthält: Mitarbeiter, Zeiteinträge, Einstellungen (ohne Passwörter)
          </p>
        </div>
        
        {/* Clear Database Section */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-3">🗑️ Datenbank löschen</h3>
          <p className="text-gray-700 mb-4 text-sm">
            ⚠️ <strong>Warnung:</strong> Das Löschen der Datenbank entfernt ALLE Zeiterfassungsdaten unwiderruflich!
            <br/>Erstellen Sie vorher ein Backup.
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
    </div>
  );
}

export default AdminView;
