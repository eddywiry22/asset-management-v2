import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import RejectionModal from '@/components/RejectionModal';
import * as movementService from '@/services/movementService';

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100  text-green-800',
  rejected: 'bg-red-100    text-red-800',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? ''}`}>
      {status}
    </span>
  );
}

const EMPTY_FORM = { asset_name: '', from_location: '', to_location: '', purpose: '' };

// ── Component ─────────────────────────────────────────────────────────────

export default function MovementsPage() {
  const { user } = useAuth();

  const canApproveOrReject = ['admin', 'warehouse_head', 'warehouse_operator'].includes(user?.role);

  // List state
  const [movements, setMovements] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Approve / reject state
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState('');

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState(null); // movement object
  const [rejectLoading, setRejectLoading] = useState(false);

  // Audit log state
  const [auditTarget, setAuditTarget] = useState(null); // movement id
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────

  const fetchMovements = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await movementService.listMovements();
      setMovements(res.data.data ?? []);
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Failed to load movements.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  // ── Create movement ─────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.asset_name.trim()) errs.asset_name = 'Asset name is required.';
    if (!form.from_location.trim()) errs.from_location = 'From location is required.';
    if (!form.to_location.trim()) errs.to_location = 'To location is required.';
    return errs;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setFormLoading(true);
    try {
      await movementService.createMovement(form);
      setFormSuccess('Movement request submitted successfully.');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchMovements();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setFormErrors(mapped);
      } else {
        setFormError(err.response?.data?.message ?? 'Failed to create movement.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ── Approve ─────────────────────────────────────────────────────────────

  const handleApprove = async (movement) => {
    setActionError('');
    setActionLoadingId(movement.id);
    try {
      await movementService.approveMovement(movement.id);
      fetchMovements();
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to approve movement.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Reject ──────────────────────────────────────────────────────────────

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await movementService.rejectMovement(rejectTarget.id, reason);
      setRejectTarget(null);
      fetchMovements();
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to reject movement.');
      setRejectTarget(null);
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Audit logs ──────────────────────────────────────────────────────────

  const handleViewAuditLogs = async (movement) => {
    if (auditTarget === movement.id) { setAuditTarget(null); return; }
    setAuditTarget(movement.id);
    setAuditLoading(true);
    try {
      const res = await movementService.getMovementAuditLogs(movement.id);
      setAuditLogs(res.data.data ?? []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Movements</h2>
          <p className="mt-1 text-sm text-gray-500">Manage asset movement requests and approvals.</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(''); setFormSuccess(''); setFormErrors({}); }}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {/* Feedback from list-level actions */}
      {formSuccess && <Alert type="success" message={formSuccess} onClose={() => setFormSuccess('')} />}
      {actionError && <Alert type="error" message={actionError} onClose={() => setActionError('')} />}

      {/* Create form */}
      {showForm && (
        <div className="card p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900">New Movement Request</h3>
          {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}
          <form onSubmit={handleCreateSubmit} noValidate className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: 'asset_name', label: 'Asset Name', placeholder: 'e.g. Dell Laptop XPS 15' },
              { name: 'from_location', label: 'From Location', placeholder: 'e.g. Warehouse A' },
              { name: 'to_location', label: 'To Location', placeholder: 'e.g. Office B' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  id={name}
                  name={name}
                  type="text"
                  value={form[name]}
                  onChange={handleFormChange}
                  placeholder={placeholder}
                  disabled={formLoading}
                  className={[
                    'block w-full rounded-md border px-3 py-2 text-sm shadow-sm',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    formErrors[name]
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
                    'disabled:bg-gray-50 disabled:opacity-70',
                  ].join(' ')}
                />
                {formErrors[name] && <p className="mt-1 text-xs text-red-600">{formErrors[name]}</p>}
              </div>
            ))}

            {/* Purpose spans full width */}
            <div className="sm:col-span-2">
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                Purpose <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows={2}
                value={form.purpose}
                onChange={handleFormChange}
                placeholder="Brief reason for the move…"
                disabled={formLoading}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:opacity-70"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={formLoading}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {formLoading ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Movements table */}
      <div className="card overflow-hidden">
        {listLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : listError ? (
          <div className="p-6"><Alert type="error" message={listError} /></div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl">↕</span>
            <p className="mt-3 text-sm">No movement requests yet.</p>
            <p className="text-xs">Create one using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Asset', 'From', 'To', 'Requested By', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {movements.map((m) => {
                  const isOwnRequest = m.requested_by_id === user?.id;
                  const isPending = m.status === 'pending';
                  const isActionLoading = actionLoadingId === m.id;

                  return (
                    <>
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{m.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{m.asset_name}</td>
                        <td className="px-4 py-3 text-gray-600">{m.from_location}</td>
                        <td className="px-4 py-3 text-gray-600">{m.to_location}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {m.requestedBy?.name ?? '—'}
                          {isOwnRequest && (
                            <span className="ml-1 text-xs text-gray-400">(you)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                          {m.status === 'rejected' && m.rejection_reason && (
                            <p className="mt-1 text-xs text-red-600 max-w-[200px] truncate" title={m.rejection_reason}>
                              {m.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Approve */}
                            {canApproveOrReject && isPending && (
                              <button
                                onClick={() => handleApprove(m)}
                                disabled={isActionLoading || isOwnRequest}
                                title={isOwnRequest ? 'You cannot approve your own request' : 'Approve'}
                                className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isActionLoading ? '…' : 'Approve'}
                              </button>
                            )}

                            {/* Reject */}
                            {canApproveOrReject && isPending && (
                              <button
                                onClick={() => setRejectTarget(m)}
                                disabled={isActionLoading}
                                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Reject
                              </button>
                            )}

                            {/* Audit logs toggle */}
                            {canApproveOrReject && (
                              <button
                                onClick={() => handleViewAuditLogs(m)}
                                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                {auditTarget === m.id ? 'Hide Log' : 'Log'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Audit log expansion row */}
                      {auditTarget === m.id && (
                        <tr key={`audit-${m.id}`} className="bg-gray-50">
                          <td colSpan={8} className="px-8 py-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Audit Log
                            </p>
                            {auditLoading ? (
                              <Spinner />
                            ) : auditLogs.length === 0 ? (
                              <p className="text-xs text-gray-400">No log entries found.</p>
                            ) : (
                              <ul className="space-y-2">
                                {auditLogs.map((log) => (
                                  <li key={log.id} className="flex items-start gap-3 text-xs text-gray-600">
                                    <span className="shrink-0 font-medium capitalize text-gray-800">{log.action}</span>
                                    <span>by <span className="font-medium">{log.performedBy?.name ?? '—'}</span></span>
                                    <span className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                                    {log.metadata?.rejection_reason && (
                                      <span className="text-red-600 italic">"{log.metadata.rejection_reason}"</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection modal */}
      <RejectionModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        isLoading={rejectLoading}
      />
    </div>
  );
}
