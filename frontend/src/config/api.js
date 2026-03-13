// API Konfiguration
// Dynamische Backend-URL: Verwendet die aktuelle Domain
// Funktioniert intern UND extern automatisch!

const getBackendURL = () => {
  // Falls REACT_APP_BACKEND_URL gesetzt ist, verwende diese
  if (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL !== 'undefined') {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Sonst: Verwende die aktuelle Domain/IP
  // window.location.origin = z.B. http://192.168.1.100:3000 oder https://meine-domain.de
  return window.location.origin;
};

export const BACKEND_URL = getBackendURL();
export const API = `${BACKEND_URL}/api`;

console.log('🔗 Backend-URL:', BACKEND_URL);
console.log('🔗 API-Endpunkt:', API);
