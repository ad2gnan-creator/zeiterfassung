function EditEmployeeModal({ editEmployee, setEditEmployee, handleUpdateEmployee, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Mitarbeiter bearbeiten</h3>
        <form onSubmit={handleUpdateEmployee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personalnummer *</label>
            <input
              data-testid="edit-employee-personnr"
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
              data-testid="edit-employee-firstname"
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
              data-testid="edit-employee-lastname"
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
              data-testid="edit-employee-department"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NFC-Chip-ID (Android)</label>
            <input
              data-testid="edit-employee-nfc"
              type="text"
              value={editEmployee.nfc_chip_id || ''}
              onChange={(e) => setEditEmployee({ ...editEmployee, nfc_chip_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. 04:1A:2B:3C:4D:5E"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QR-Code (iOS, min. 8 Zeichen)</label>
            <input
              data-testid="edit-employee-qr"
              type="text"
              value={editEmployee.qr_code || ''}
              onChange={(e) => setEditEmployee({ ...editEmployee, qr_code: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. EMP12345"
              minLength="8"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              data-testid="cancel-edit-btn"
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            >
              Abbrechen
            </button>
            <button
              data-testid="save-employee-btn"
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

export default EditEmployeeModal;
