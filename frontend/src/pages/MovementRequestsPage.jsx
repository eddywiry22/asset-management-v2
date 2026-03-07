import { useEffect, useState, useCallback } from 'react';
import { getAll } from '@/services/movementRequestService';
import { useAuth } from '@/contexts/AuthContext';
import useNotificationCount from '@/hooks/useNotificationCount';

const STATUS_LABELS = {
  PENDING_HEAD_APPROVAL: 'Pending Head Approval',
  PENDING_DESTINATION_APPROVAL: 'Pending Destination Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_COLORS = {
  PENDING_HEAD_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PENDING_DESTINATION_APPROVAL: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function MovementRequestsPage() {
  const { user } = useAuth();
  const { refresh: refreshCount } = useNotificationCount();
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requiresMyAction, setRequiresMyAction] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const canTakeAction = ['warehouse_head', 'operator'].includes(user?.role);
  const showRequiresMyActionFilter = ['warehouse_head', 'operator', 'requester'].includes(user?.role);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (requiresMyAction) params.requiresMyAction = 'true';
      if (statusFilter) params.status = statusFilter;
      const res = await getAll(params);
      setRequests(res.data?.data ?? []);
      setTotal(res.data?.meta?.total ?? 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [requiresMyAction, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Movement Requests</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {showRequiresMyActionFilter && (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={requiresMyAction}
              onChange={(e) => setRequiresMyAction(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Show Requests Requiring My Action
          </label>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-1.5 text-sm"
            disabled={requiresMyAction}
          >
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center text-sm text-gray-500 shadow-sm">
          No movement requests found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Asset</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Requester</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">From → To</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                {canTakeAction && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.asset_description}</td>
                  <td className="px-4 py-3 text-gray-700">{r.requester?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.source_location_id} → {r.destination_location_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    {r.status === 'REJECTED' && r.rejection_reason && (
                      <p className="mt-0.5 text-xs text-red-600">{r.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  {canTakeAction && (
                    <td className="px-4 py-3">
                      <ActionButtons
                        request={r}
                        user={user}
                        onDone={() => { fetchRequests(); refreshCount(); }}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActionButtons({ request, user, onDone }) {
  const [busy, setBusy] = useState(false);

  const canAct =
    (user.role === 'warehouse_head' && request.status === 'PENDING_HEAD_APPROVAL') ||
    (user.role === 'operator' &&
      request.status === 'PENDING_DESTINATION_APPROVAL' &&
      request.destination_location_id === user.location_id);

  if (!canAct) return null;

  const handle = async (action) => {
    let rejectionReason = null;
    if (action === 'reject') {
      rejectionReason = window.prompt('Rejection reason (optional):') || '';
    }
    setBusy(true);
    try {
      const { updateStatus } = await import('@/services/movementRequestService');
      await updateStatus(request.id, action, rejectionReason);
      onDone();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('approve')}
        disabled={busy}
        className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={busy}
        className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
