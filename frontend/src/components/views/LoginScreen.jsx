function LoginScreen({ 
  loginUsername, 
  setLoginUsername, 
  loginPassword, 
  setLoginPassword, 
  loginError, 
  handleLogin, 
  loading, 
  handleRequestAdminReset 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">⏱️ Zeiterfassung</h2>
        <p className="text-gray-600 mb-8 text-center">Bitte melden Sie sich an</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Benutzer</label>
            <select
              data-testid="login-user-select"
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
              data-testid="login-password-input"
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
            data-testid="login-submit-btn"
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
                data-testid="admin-reset-btn"
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

export default LoginScreen;
