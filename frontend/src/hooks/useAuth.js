import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';

export function useAuth(showMessage) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [loginUsername, setLoginUsername] = useState('user');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedAuth === 'true' && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setCurrentUser(user);
        setShowLoginModal(false);
      } catch (error) {
        console.error('Fehler beim Laden der Sitzung:', error);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API}/login`, {
        username: loginUsername,
        password: loginPassword
      });
      
      if (response.data.success) {
        const user = { username: response.data.username, role: response.data.role };
        setIsAuthenticated(true);
        setCurrentUser(user);
        setShowLoginModal(false);
        setLoginPassword('');
        
        // Save to localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showMessage(`Willkommen, ${response.data.username}!`);
      } else {
        setLoginError(response.data.message || 'Login fehlgeschlagen');
      }
    } catch (error) {
      setLoginError('Fehler beim Login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLoginModal(true);
    
    // Clear localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    
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
      const currentUrl = window.location.origin;
      
      const response = await axios.post(`${API}/request-password-reset`, {
        username: 'administrator',
        frontend_url: currentUrl
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

  return {
    isAuthenticated,
    currentUser,
    showLoginModal,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    loading,
    showPasswordModal,
    setShowPasswordModal,
    passwordData,
    setPasswordData,
    handleLogin,
    handleLogout,
    handlePasswordChange,
    handleRequestAdminReset,
    handleResetUserPassword
  };
}
