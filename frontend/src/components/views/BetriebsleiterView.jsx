import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../../config/api';

function BetriebsleiterView() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('Alle');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadEmployeeStatus = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedDepartment !== 'Alle' ? { abteilung: selectedDepartment } : {};
      const response = await axios.get(`${API}/employee-status`, { params });
      setEmployees(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter-Status:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(['Alle', ...response.data]);
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error);
      setDepartments(['Alle', 'Holz', 'Kunststoff', 'Montage', 'Verwaltung']);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadEmployeeStatus();
  }, [loadEmployeeStatus]);

  // Auto-refresh alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(() => {
      loadEmployeeStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadEmployeeStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Arbeitsbeginn':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Pause':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pausenende':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ende':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Arbeitsbeginn':
        return '▶️';
      case 'Pause':
        return '⏸️';
      case 'Pausenende':
        return '⏯️';
      case 'Ende':
        return '⏹️';
      default:
        return '❓';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  // Statistiken berechnen
  const stats = {
    total: employees.length,
    arbeitsbeginn: employees.filter(e => e.last_status === 'Arbeitsbeginn').length,
    pause: employees.filter(e => e.last_status === 'Pause').length,
    pausenende: employees.filter(e => e.last_status === 'Pausenende').length,
    ende: employees.filter(e => e.last_status === 'Ende').length,
    keinStatus: employees.filter(e => !e.last_status).length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header mit Statistiken */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mitarbeiter-Übersicht</h2>
            <p className="text-gray-500 text-sm mt-1">
              Letztes Update: {lastUpdate ? lastUpdate.toLocaleTimeString('de-DE') : '-'}
              <span className="ml-2 text-xs text-gray-400">(Auto-Refresh alle 30 Sek.)</span>
            </p>
          </div>
          <button
            data-testid="refresh-status-btn"
            onClick={loadEmployeeStatus}
            disabled={loading}
            className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Lade...' : '🔄 Aktualisieren'}
          </button>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Gesamt</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.arbeitsbeginn}</div>
            <div className="text-sm text-green-600">▶️ Arbeiten</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{stats.pause}</div>
            <div className="text-sm text-yellow-600">⏸️ Pause</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.pausenende}</div>
            <div className="text-sm text-blue-600">⏯️ Nach Pause</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <div className="text-2xl font-bold text-red-700">{stats.ende}</div>
            <div className="text-sm text-red-600">⏹️ Feierabend</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-500">{stats.keinStatus}</div>
            <div className="text-sm text-gray-500">❓ Kein Status</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-xl p-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-gray-700 font-medium py-2 mr-2">Abteilung:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              data-testid={`filter-dept-${dept.toLowerCase()}`}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDepartment === dept
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Mitarbeiter-Liste */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {loading && employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">⏳</div>
            <p>Lade Mitarbeiter-Status...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">👥</div>
            <p>Keine Mitarbeiter in dieser Abteilung gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mitarbeiter</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Personalnr.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Abteilung</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Letzter Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Datum / Uhrzeit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr 
                    key={emp.id} 
                    data-testid={`employee-row-${emp.personalnummer}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {emp.vorname} {emp.nachname}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {emp.personalnummer}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        {emp.abteilung}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.last_status ? (
                        <span className={`px-3 py-2 rounded-lg border text-sm font-medium inline-flex items-center gap-2 ${getStatusColor(emp.last_status)}`}>
                          <span>{getStatusIcon(emp.last_status)}</span>
                          <span>{emp.last_status}</span>
                        </span>
                      ) : (
                        <span className="px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm">
                          Kein Eintrag
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {emp.last_date && emp.last_time ? (
                        <div>
                          <span className="font-medium">{formatDate(emp.last_date)}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span>{emp.last_time}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BetriebsleiterView;
