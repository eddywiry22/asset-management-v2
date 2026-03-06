import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLocations, createLocation, updateLocation, deleteLocation } from '@/services/locationService';

const EMPTY_FORM = { name: '', code: '', description: '', isActive: true };

export default function LocationsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getLocations();
      setLocations(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, description: item.description || '', isActive: item.isActive });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await updateLocation(editing.id, form);
      } else {
        await createLocation(form);
      }
      closeModal();
      load();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!window.confirm(`Deactivate "${item.name}"?`)) return;
    try {
      await deleteLocation(item.id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
          <p className="mt-1 text-sm text-gray-500">Manage warehouse and storage locations.</p>
        </div>
        {canWrite && (
          <button onClick={openCreate} className="btn-primary">
            + Add Location
          </button>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : locations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No locations found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Code', 'Description', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locations.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{item.code}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {canWrite && (
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    )}
                    {canDelete && item.isActive && (
                      <button onClick={() => handleDeactivate(item)} className="text-red-500 hover:underline text-xs">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {editing ? 'Edit Location' : 'Add Location'}
            </h3>
            {formError && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input className="input font-mono" placeholder="e.g. WH-A1" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
