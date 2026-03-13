import { useState } from 'react';
import QRScannerModal from '../modals/QRScannerModal';

function TerminalView({ 
  employees, 
  selectedEmployee, 
  setSelectedEmployee, 
  handleTimeEntry, 
  loading, 
  deviceType, 
  handleNFCLogin, 
  processQRLogin, 
  isScanning, 
  currentUser, 
  showQRScanner, 
  setShowQRScanner 
}) {
  const [activeTab, setActiveTab] = useState('Holz');
  const [showManualSelection, setShowManualSelection] = useState(false);
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
              data-testid="time-entry-start-btn"
              onClick={() => handleTimeEntry('Arbeitsbeginn')}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ▶️ Arbeitsbeginn
            </button>
            <button
              data-testid="time-entry-pause-btn"
              onClick={() => handleTimeEntry('Pause')}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ⏸️ Pause
            </button>
            <button
              data-testid="time-entry-resume-btn"
              onClick={() => handleTimeEntry('Pausenende')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ⏯️ Pausenende
            </button>
            <button
              data-testid="time-entry-end-btn"
              onClick={() => handleTimeEntry('Ende')}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-12 px-6 rounded-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 text-xl"
            >
              ⏹️ Ende
            </button>
          </div>

          <button
            data-testid="cancel-employee-selection-btn"
            onClick={() => setSelectedEmployee(null)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  // Show manual selection if requested
  if (showManualSelection) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mitarbeiter auswählen</h2>
            <button
              data-testid="back-to-scanner-btn"
              onClick={() => setShowManualSelection(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Zurück
            </button>
          </div>
          
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                data-testid={`dept-tab-${dept.toLowerCase()}`}
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
                  data-testid={`employee-select-${emp.personalnummer}`}
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

  // Main scanner view
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {deviceType === 'android' ? '🔹 Android-Gerät erkannt' : deviceType === 'ios' ? '📱 iOS-Gerät erkannt' : 'Willkommen'}
        </h2>
        
        <div className="space-y-4 mb-8">
          {deviceType === 'android' && (
            <button
              data-testid="nfc-scan-btn"
              onClick={handleNFCLogin}
              disabled={isScanning}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-12 px-6 rounded-xl shadow-xl transform transition hover:scale-105 disabled:opacity-50 text-2xl"
            >
              {isScanning ? '⏳ NFC-Reader aktiv...' : '🔹 NFC-Chip scannen'}
            </button>
          )}
          
          {deviceType === 'ios' && (
            <button
              data-testid="qr-scan-btn"
              onClick={() => setShowQRScanner(true)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-12 px-6 rounded-xl shadow-xl transform transition hover:scale-105 disabled:opacity-50 text-2xl"
            >
              📱 QR-Code scannen
            </button>
          )}

          {currentUser && currentUser.role === 'admin' && (
            <button
              data-testid="manual-selection-btn"
              onClick={() => setShowManualSelection(true)}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-8 px-6 rounded-xl shadow-xl transform transition hover:scale-105 text-xl"
            >
              👥 Manuelle Auswahl
            </button>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p className="mb-2">
            {deviceType === 'android' 
              ? 'Halten Sie Ihren NFC-Chip an das Gerät oder wählen Sie manuell' 
              : deviceType === 'ios'
              ? 'Scannen Sie Ihren QR-Code oder wählen Sie manuell'
              : 'Wählen Sie Ihre Login-Methode'}
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onScan={(qrCode) => processQRLogin(qrCode)}
        />
      )}
    </div>
  );
}

export default TerminalView;
