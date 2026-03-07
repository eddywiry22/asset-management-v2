import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as movementService from '@/services/movementService';
import MovementStatusBadge from '@/components/MovementStatusBadge';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending Head', value: 'PENDING_HEAD_APPROVAL' },
  { label: 'Pending Dest.', value: 'PENDING_DESTINATION_APPROVAL' },
  { label: 'Ready to Finalize', value: 'APPROVED_READY_FOR_FINALIZATION' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function MovementsListPage() {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await movementService.listMovements(params);
      setMovements(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movements');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goods Movements</h2>
          <p className="mt-1 text-sm text-gray-500">Manage inter-location stock movement requests.</p>
        </div>
        <button
          onClick={() => navigate('/movements/new')}
          className="btn btn-primary"
        >
          + New Movement
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleStatusFilter(value)}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              statusFilter === value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl">↔</span>
            <p className="mt-3 text-sm">No movement requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Movement #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Route</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Requested By</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/movements/${m.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-primary-700">{m.movementNumber}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="font-medium">{m.originLocation?.code}</span>
                      <span className="mx-1.5 text-gray-400">→</span>
                      <span className="font-medium">{m.destinationLocation?.code}</span>
                      <div className="text-xs text-gray-400">
                        {m.originLocation?.name} → {m.destinationLocation?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{m.details?.length ?? '—'}</td>
                    <td className="px-4 py-3">
                      <MovementStatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.requestedBy?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing page {meta.page} of {meta.pages} ({meta.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
