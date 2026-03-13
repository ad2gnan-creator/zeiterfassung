function PasswordModal({ passwordData, setPasswordData, handlePasswordChange, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Passwort ändern</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Altes Passwort</label>
            <input
              data-testid="old-password-input"
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Neues Passwort</label>
            <input
              data-testid="new-password-input"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Passwort bestätigen</label>
            <input
              data-testid="confirm-password-input"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              data-testid="cancel-password-change-btn"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              data-testid="save-password-btn"
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

export default PasswordModal;
