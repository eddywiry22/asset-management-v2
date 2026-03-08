import { useEffect, useReducer, useCallback } from 'react';
import locationService from '@/services/locationService';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';
import { useAuth } from '@/contexts/AuthContext';

// ─── State management ────────────────────────────────────────────────────────

const initialState = {
  locations: [],
  loading: true,
  error: null,
  // Modal state
  modal: null, // null | { mode: 'create' | 'edit', location?: object }
  saving: false,
  saveError: null,
  // Delete confirmation
  deleting: null, // location id being deleted
  deleteError: null,
  // Logs panel
  logs: null, // null | { locationId, entries: [], loading: bool }
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, locations: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'OPEN_CREATE':
      return { ...state, modal: { mode: 'create' }, saveError: null };
    case 'OPEN_EDIT':
      return { ...state, modal: { mode: 'edit', location: action.payload }, saveError: null };
    case 'CLOSE_MODAL':
      return { ...state, modal: null, saveError: null };
    case 'SAVE_START':
      return { ...state, saving: true, saveError: null };
    case 'SAVE_SUCCESS': {
      const updated = action.payload;
      const exists = state.locations.some((l) => l.id === updated.id);
      const locations = exists
        ? state.locations.map((l) => (l.id === updated.id ? updated : l))
        : [...state.locations, updated];
      return { ...state, saving: false, modal: null, locations };
    }
    case 'SAVE_ERROR':
      return { ...state, saving: false, saveError: action.payload };
    case 'DELETE_START':
      return { ...state, deleting: action.payload, deleteError: null };
    case 'DELETE_SUCCESS':
      return {
        ...state,
        deleting: null,
        locations: state.locations.filter((l) => l.id !== action.payload),
      };
    case 'DELETE_ERROR':
      return { ...state, deleting: null, deleteError: action.payload };
    case 'CLEAR_DELETE_ERROR':
      return { ...state, deleteError: null };
    case 'OPEN_LOGS':
      return { ...state, logs: { locationId: action.payload, entries: [], loading: true } };
    case 'LOGS_LOADED':
      return { ...state, logs: { ...state.logs, entries: action.payload, loading: false } };
    case 'LOGS_ERROR':
      return { ...state, logs: { ...state.logs, loading: false, error: action.payload } };
    case 'CLOSE_LOGS':
      return { ...state, logs: null };
    default:
      return state;
  }
}

// ─── LocationForm (create / edit) ────────────────────────────────────────────

function LocationForm({ initial, onSubmit, onCancel, saving, error }) {
  const empty = { name: '', address: '', status: 'ACTIVE' };
  const defaults = initial ? { name: initial.name, address: initial.address, status: initial.status } : empty;

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSubmit({ name: fd.get('name'), address: fd.get('address'), status: fd.get('status') });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="loc-name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="loc-name"
          name="name"
          type="text"
          defaultValue={defaults.name}
          required
          maxLength={150}
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="loc-address">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          id="loc-address"
          name="address"
          defaultValue={defaults.address}
          required
          rows={3}
          className="input w-full resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="loc-status">
          Status
        </label>
        <select id="loc-status" name="status" defaultValue={defaults.status} className="input w-full">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Spinner size="sm" className="mr-2" /> : null}
          {initial ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls =
    status === 'ACTIVE'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Logs panel ──────────────────────────────────────────────────────────────

function LogsPanel({ logsState, onClose }) {
  if (!logsState) return null;
  return (
    <Modal title="Change Log" onClose={onClose}>
      {logsState.loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : logsState.error ? (
        <Alert type="error" message={logsState.error} />
      ) : logsState.entries.length === 0 ? (
        <p className="text-sm text-gray-500">No log entries found.</p>
      ) : (
        <ul className="divide-y text-sm max-h-96 overflow-y-auto">
          {logsState.entries.map((log) => (
            <li key={log.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-medium ${log.action === 'CREATED' ? 'text-blue-700' : 'text-amber-700'}`}>
                  {log.action}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
              {log.performer && (
                <p className="text-xs text-gray-500">by {log.performer.name} ({log.performer.email})</p>
              )}
              {log.changes && (
                <div className="mt-1 rounded-md bg-gray-50 p-2 text-xs font-mono text-gray-700 space-y-0.5">
                  {Object.entries(log.changes).map(([field, val]) => {
                    // CREATED: changes is flat { field: value }; UPDATED: { field: { from, to } }
                    if (val && typeof val === 'object' && 'from' in val) {
                      return (
                        <div key={field}>
                          <span className="font-semibold">{field}:</span> {String(val.from)} → {String(val.to)}
                        </div>
                      );
                    }
                    return (
                      <div key={field}>
                        <span className="font-semibold">{field}:</span> {String(val)}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const canWrite = user?.role === 'admin' || user?.role === 'warehouse_head';
  const canDelete = user?.role === 'admin' || user?.role === 'warehouse_head';

  const fetchLocations = useCallback(async () => {
    try {
      const res = await locationService.getAll();
      dispatch({ type: 'FETCH_SUCCESS', payload: res.data.data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.response?.data?.message || 'Failed to load locations.' });
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleSave = async (data) => {
    dispatch({ type: 'SAVE_START' });
    try {
      let res;
      if (state.modal.mode === 'create') {
        res = await locationService.create(data);
      } else {
        res = await locationService.update(state.modal.location.id, data);
      }
      dispatch({ type: 'SAVE_SUCCESS', payload: res.data.data });
    } catch (err) {
      dispatch({ type: 'SAVE_ERROR', payload: err.response?.data?.message || 'Failed to save.' });
    }
  };

  const handleDelete = async (location) => {
    if (!window.confirm(`Delete "${location.name}"? This cannot be undone.`)) return;
    dispatch({ type: 'DELETE_START', payload: location.id });
    try {
      await locationService.remove(location.id);
      dispatch({ type: 'DELETE_SUCCESS', payload: location.id });
    } catch (err) {
      dispatch({ type: 'DELETE_ERROR', payload: err.response?.data?.message || 'Failed to delete.' });
    }
  };

  const openLogs = async (location) => {
    dispatch({ type: 'OPEN_LOGS', payload: location.id });
    try {
      const res = await locationService.getLogs(location.id);
      dispatch({ type: 'LOGS_LOADED', payload: res.data.data });
    } catch (err) {
      dispatch({ type: 'LOGS_ERROR', payload: err.response?.data?.message || 'Failed to load logs.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
          <p className="mt-1 text-sm text-gray-500">Manage physical locations for asset tracking.</p>
        </div>
        {canWrite && (
          <button className="btn-primary" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
            + New Location
          </button>
        )}
      </div>

      {/* Global errors */}
      {state.error && <Alert type="error" message={state.error} onClose={() => dispatch({ type: 'FETCH_ERROR', payload: null })} />}
      {state.deleteError && (
        <Alert type="error" message={state.deleteError} onClose={() => dispatch({ type: 'CLEAR_DELETE_ERROR' })} />
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {state.loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : state.locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl">◫</span>
            <p className="mt-3 text-sm">No locations yet.</p>
            {canWrite && (
              <button className="mt-4 btn-primary text-sm" onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
                Create the first one
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Address</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {state.locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{loc.name}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{loc.address}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={loc.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => openLogs(loc)}
                      >
                        Logs
                      </button>
                      {canWrite && (
                        <button
                          className="text-xs text-amber-600 hover:underline"
                          onClick={() => dispatch({ type: 'OPEN_EDIT', payload: loc })}
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="text-xs text-red-600 hover:underline"
                          disabled={state.deleting === loc.id}
                          onClick={() => handleDelete(loc)}
                        >
                          {state.deleting === loc.id ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {state.modal && (
        <Modal
          title={state.modal.mode === 'create' ? 'New Location' : 'Edit Location'}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        >
          <LocationForm
            initial={state.modal.location}
            onSubmit={handleSave}
            onCancel={() => dispatch({ type: 'CLOSE_MODAL' })}
            saving={state.saving}
            error={state.saveError}
          />
        </Modal>
      )}

      {/* Logs modal */}
      <LogsPanel logsState={state.logs} onClose={() => dispatch({ type: 'CLOSE_LOGS' })} />
    </div>
  );
}
