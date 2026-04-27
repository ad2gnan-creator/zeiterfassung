import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../config/api';

function ResetPasswordView({ token, onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validierung
    if (newPassword.length < 3) {
      setError('Das Passwort muss mindestens 3 Zeichen lang sein');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/reset-password-with-token`, null, {
        params: {
          token: token,
          new_password: newPassword
        }
      });

      if (response.data.message) {
        setSuccess(true);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Fehler beim Zurücksetzen des Passworts';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Passwort erfolgreich geändert!</h2>
          <p className="text-gray-600 mb-6">
            Ihr neues Passwort wurde gespeichert. Sie können sich jetzt mit dem neuen Passwort anmelden.
          </p>
          <button
            data-testid="back-to-login-btn"
            onClick={onComplete}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">🔑 Passwort zurücksetzen</h2>
        <p className="text-gray-600 mb-6 text-center">
          Geben Sie Ihr neues Passwort für den Administrator-Account ein.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neues Passwort
            </label>
            <input
              data-testid="new-password-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Mindestens 3 Zeichen"
              required
              minLength={3}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort bestätigen
            </label>
            <input
              data-testid="confirm-password-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Passwort wiederholen"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            data-testid="submit-reset-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            data-testid="cancel-reset-btn"
            onClick={onComplete}
            className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Abbrechen und zur Anmeldung
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordView;
