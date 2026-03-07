import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAdjustments,
  requestAdjustment,
  approveAdjustment,
  rejectAdjustment,
} from '@/services/stockAdjustmentService';
import { getGoods } from '@/services/goodsService';
import { getLocations } from '@/services/locationService';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const TYPE_LABELS = { add: '+ Add', subtract: '- Subtract', set: '= Set' };

const EMPTY_REQUEST = {
  goods_id: '',
  location_id: '',
  adjustment_type: 'add',
  quantity: '',
  reason: '',
};

export default function StockAdjustmentsPage() {
  const { user } = useAuth();
  const canReview = user?.role === 'admin' || user?.role === 'manager';

  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [goodsList, setGoodsList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);

  // Request modal
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState(EMPTY_REQUEST);
  const [reqSaving, setReqSaving] = useState(false);
  const [reqError, setReqError] = useState('');

  // Review modal
  const [reviewing, setReviewing] = useState(null); // { adj, action: 'approve'|'reject' }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getAdjustments(params);
      setAdjustments(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    getGoods({ isActive: true }).then((r) => setGoodsList(r.data || [])).catch(() => {});
    getLocations({ isActive: true }).then((r) => setLocationsList(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // --- Request adjustment ---
  const openRequest = () => {
    setReqForm(EMPTY_REQUEST);
    setReqError('');
    setShowRequest(true);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setReqSaving(true);
    setReqError('');
    try {
      await requestAdjustment({
        ...reqForm,
        goods_id: Number(reqForm.goods_id),
        location_id: Number(reqForm.location_id),
        quantity: Number(reqForm.quantity),
      });
      setShowRequest(false);
      load();
    } catch (e) {
      setReqError(e.response?.data?.message || 'Request failed');
    } finally {
      setReqSaving(false);
    }
  };

  // --- Review (approve / reject) ---
  const openReview = (adj, action) => {
    setReviewing({ adj, action });
    setReviewNote('');
    setReviewError('');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setReviewSaving(true);
    setReviewError('');
    try {
      if (reviewing.action === 'approve') {
        await approveAdjustment(reviewing.adj.id, { review_note: reviewNote });
      } else {
        await rejectAdjustment(reviewing.adj.id, { review_note: reviewNote });
      }
      setReviewing(null);
      load();
    } catch (e) {
      setReviewError(e.response?.data?.message || 'Action failed');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Adjustments</h2>
          <p className="mt-1 text-sm text-gray-500">Manual stock adjustments require approval before taking effect.</p>
        </div>
        <button onClick={openRequest} className="btn-primary">
          + Request Adjustment
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          className="input w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={load} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : adjustments.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No adjustments found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Goods', 'Location', 'Type', 'Qty', 'Reason', 'Status', 'Requested By', 'Reviewed By', ''].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900">{adj.stock?.goods?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-gray-600">{adj.stock?.location?.name ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                      {TYPE_LABELS[adj.adjustment_type] ?? adj.adjustment_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold">{parseFloat(adj.quantity).toLocaleString()}</td>
                  <td className="px-3 py-3 text-gray-500 max-w-[160px] truncate" title={adj.reason}>{adj.reason || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[adj.status]}`}>
                      {adj.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{adj.requester?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">
                    {adj.reviewer ? (
                      <span title={adj.review_note || ''}>{adj.reviewer.name}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right space-x-2">
                    {canReview && adj.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openReview(adj, 'approve')}
                          className="text-green-600 hover:underline text-xs font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openReview(adj, 'reject')}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Request Adjustment Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Request Stock Adjustment</h3>
            <p className="mb-4 text-xs text-gray-500 bg-yellow-50 rounded p-2">
              This adjustment will be submitted for approval by an admin or manager before stock is updated.
            </p>
            {reqError && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{reqError}</div>}
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goods *</label>
                <select
                  className="input"
                  value={reqForm.goods_id}
                  onChange={(e) => setReqForm({ ...reqForm, goods_id: e.target.value })}
                  required
                >
                  <option value="">Select goods…</option>
                  {goodsList.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <select
                  className="input"
                  value={reqForm.location_id}
                  onChange={(e) => setReqForm({ ...reqForm, location_id: e.target.value })}
                  required
                >
                  <option value="">Select location…</option>
                  {locationsList.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
                <select
                  className="input"
                  value={reqForm.adjustment_type}
                  onChange={(e) => setReqForm({ ...reqForm, adjustment_type: e.target.value })}
                >
                  <option value="add">Add to stock</option>
                  <option value="subtract">Subtract from stock</option>
                  <option value="set">Set exact quantity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  className="input"
                  value={reqForm.quantity}
                  onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Explain why this adjustment is needed…"
                  value={reqForm.reason}
                  onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={reqSaving} className="btn-primary flex-1">
                  {reqSaving ? 'Submitting…' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowRequest(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 capitalize">
              {reviewing.action} Adjustment
            </h3>
            <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
              <p><span className="font-medium">Goods:</span> {reviewing.adj.stock?.goods?.name}</p>
              <p><span className="font-medium">Location:</span> {reviewing.adj.stock?.location?.name}</p>
              <p><span className="font-medium">Type:</span> {TYPE_LABELS[reviewing.adj.adjustment_type]}</p>
              <p><span className="font-medium">Quantity:</span> {parseFloat(reviewing.adj.quantity).toLocaleString()}</p>
              {reviewing.adj.reason && <p><span className="font-medium">Reason:</span> {reviewing.adj.reason}</p>}
            </div>
            {reviewError && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{reviewError}</div>}
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Note</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Optional note…"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={reviewSaving}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white ${
                    reviewing.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {reviewSaving ? 'Processing…' : reviewing.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewing(null)}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
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
