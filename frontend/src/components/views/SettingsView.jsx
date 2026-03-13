function SettingsView({ 
  settings, 
  setSettings, 
  handleSaveSettings, 
  handleDownloadCSV, 
  handleTestEmail, 
  loading 
}) {
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
                data-testid="admin-reset-email-input"
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
                    data-testid="smtp-server-input"
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
                    data-testid="smtp-port-input"
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
                    data-testid="use-tls-checkbox"
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
                  data-testid="email-sender-input"
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
                  data-testid="email-password-input"
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
                  data-testid="email-recipient-input"
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
                  data-testid="send-time-input"
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
            data-testid="save-settings-btn"
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
            data-testid="download-csv-btn"
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
            data-testid="test-email-btn"
            onClick={handleTestEmail}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gesendet...' : 'Alle Daten jetzt per Email senden'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Versendet eine Email mit ALLEN Zeiterfassungsdaten aus der Datenbank.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
