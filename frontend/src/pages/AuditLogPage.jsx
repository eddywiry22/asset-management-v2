import { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs, fetchAuditModules } from '@/services/auditLogService';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';

const ACTION_BADGE = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  VIEW: 'bg-gray-100 text-gray-600',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-yellow-100 text-yellow-700',
  EXPORT: 'bg-orange-100 text-orange-700',
};

function JsonModal({ title, data, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <pre className="max-h-96 overflow-auto p-5 text-xs text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { title, data }

  const [filters, setFilters] = useState({
    module: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const loadModules = async () => {
    try {
      const res = await fetchAuditModules();
      setModules(res.data ?? []);
    } catch {
      // non-critical
    }
  };

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: pagination.limit };
      if (filters.module) params.module = filters.module;
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const res = await fetchAuditLogs(params);
      setLogs(res.data ?? []);
      setPagination((prev) => ({
        ...prev,
        page: res.meta?.page ?? page,
        total: res.meta?.total ?? 0,
        totalPages: res.meta?.totalPages ?? 1,
      }));

      // Collect unique users from results for the user filter dropdown
      setUsers((prev) => {
        const map = new Map(prev.map((u) => [u.id, u]));
        (res.data ?? []).forEach((log) => {
          if (log.user) map.set(log.user.id, log.user);
        });
        return Array.from(map.values());
      });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadLogs(1);
  };

  const handleReset = () => {
    setFilters({ module: '', user_id: '', date_from: '', date_to: '' });
    setTimeout(() => loadLogs(1), 0);
  };

  const handlePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    loadLogs(newPage);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
        <p className="mt-1 text-sm text-gray-500">Read-only record of all system activity.</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Module filter */}
          <div>
            <label className="label" htmlFor="filter-module">
              Module
            </label>
            <select
              id="filter-module"
              name="module"
              value={filters.module}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div>
            <label className="label" htmlFor="filter-user">
              User
            </label>
            <select
              id="filter-user"
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="label" htmlFor="filter-date-from">
              Date from
            </label>
            <input
              id="filter-date-from"
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="input"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="label" htmlFor="filter-date-to">
              Date to
            </label>
            <input
              id="filter-date-to"
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button type="button" onClick={handleReset} className="btn">
            Reset
          </button>
          {pagination.total > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {pagination.total} {pagination.total === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
      </form>

      {/* Error */}
      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl">◈</span>
            <p className="mt-3 text-sm">No audit log entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-gray-900">{log.user.name}</p>
                          <p className="text-xs text-gray-400">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.module_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {log.entity_id ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[log.action_type] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {log.action_type}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-600">
                      <p className="truncate">{log.description ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {log.old_value !== null && (
                          <button
                            onClick={() => setModal({ title: 'Old Value', data: log.old_value })}
                            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                            title="View old value"
                          >
                            Old
                          </button>
                        )}
                        {log.new_value !== null && (
                          <button
                            onClick={() => setModal({ title: 'New Value', data: log.new_value })}
                            className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
                            title="View new value"
                          >
                            New
                          </button>
                        )}
                        {log.old_value === null && log.new_value === null && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => handlePage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* JSON value modal */}
      {modal && (
        <JsonModal title={modal.title} data={modal.data} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
