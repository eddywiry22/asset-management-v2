import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as movementService from '@/services/movementService';
import { useAuth } from '@/contexts/AuthContext';
import MovementStatusBadge from '@/components/MovementStatusBadge';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';
import SuccessModal from '@/components/SuccessModal';

const fmt = (val) => {
  if (val === null || val === undefined) return <span className="text-gray-400 italic">—</span>;
  return parseFloat(val).toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/**
 * Generic modal that requires the user to supply a reason (min 5 chars) before
 * confirming a destructive action. Used for both Reject and Recall flows.
 */
function ReasonModal({ title, description, confirmLabel, confirmClass, processingLabel, onConfirm, onCancel, isLoading }) {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleConfirm = () => {
    if (reason.trim().length < 5) {
      setValidationError('Reason must be at least 5 characters.');
      return;
    }
    setValidationError('');
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-4 text-sm text-gray-500">{description}</p>
        <textarea
          rows={3}
          className="input mb-1"
          placeholder="Reason (min 5 characters)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {validationError && (
          <p className="mb-2 text-xs text-red-600">{validationError}</p>
        )}
        <div className="flex justify-end gap-3 mt-3">
          <button onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`${confirmClass} disabled:opacity-50`}
            disabled={isLoading}
          >
            {isLoading ? processingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ label, user, date }) {
  if (!user && !date) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-40 shrink-0 font-medium text-gray-600">{label}</span>
      <span className="text-gray-800">
        {user?.name ?? '—'}
        {date && <span className="ml-2 text-gray-400 text-xs">{fmtDate(date)}</span>}
      </span>
    </div>
  );
}

export default function MovementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movement, setMovement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successModal, setSuccessModal] = useState(null); // { title, message }
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);

  // Per-action role lists (backend enforces location ownership; frontend shows
  // the button for any eligible role and lets the API return 403 if mismatched).
  const canApproveHead = ['admin', 'warehouse_head'].includes(user?.role);
  const canApproveDest = ['admin', 'warehouse_operator'].includes(user?.role);
  // BUG-R9-02 fix: warehouse_head at destination may also finalize
  const canFinalize    = ['admin', 'warehouse_operator', 'warehouse_head'].includes(user?.role);
  const canReject      = ['admin', 'warehouse_head', 'warehouse_operator'].includes(user?.role);
  // BUG-R9-04/05 fix: recall is the post-approval halt action
  const canRecall      = ['admin', 'manager', 'warehouse_head', 'warehouse_operator'].includes(user?.role);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await movementService.getMovement(id);
      setMovement(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const performAction = async (actionFn, successTitle, successMessage) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await actionFn();
      setMovement(res.data.data);
      setSuccessModal({ title: successTitle, message: successMessage });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveHead = () =>
    performAction(
      () => movementService.approveByHead(id),
      'Movement Approved',
      'The movement has been approved by the warehouse head and is pending destination approval.'
    );

  const handleApproveDest = () =>
    performAction(
      () => movementService.approveByDestination(id),
      'Movement Approved',
      'The movement has been approved by the destination and is ready for finalization.'
    );

  const handleFinalize = () =>
    performAction(
      () => movementService.finalizeMovement(id),
      'Movement Finalized',
      'The movement has been completed and stock levels have been updated.'
    );

  const handleReject = async (reason) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await movementService.rejectMovement(id, reason);
      setMovement(res.data.data);
      setShowRejectModal(false);
      setSuccessModal({ title: 'Movement Rejected', message: 'The movement request has been rejected.' });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async (reason) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await movementService.recallMovement(id, reason);
      setMovement(res.data.data);
      setShowRecallModal(false);
      setSuccessModal({ title: 'Movement Recalled', message: 'The approved movement has been recalled. Stock will not be updated.' });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Recall failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert type="error" message={error} />
        <button className="btn btn-secondary" onClick={() => navigate('/movements')}>
          ← Back to Movements
        </button>
      </div>
    );
  }

  const { status, details = [] } = movement;

  // Determine which action buttons to show.
  // Reject and Recall are mutually exclusive by status:
  //   Reject  → only at pre-finalization stages (PENDING_*)
  //   Recall  → only at APPROVED_READY_FOR_FINALIZATION
  // After a recall the status becomes REJECTED, hiding both buttons automatically.
  const showApproveHead = canApproveHead && status === 'PENDING_HEAD_APPROVAL';
  const showApproveDest = canApproveDest && status === 'PENDING_DESTINATION_APPROVAL';
  const showFinalize    = canFinalize && status === 'APPROVED_READY_FOR_FINALIZATION';
  const showReject      = canReject && ['PENDING_HEAD_APPROVAL', 'PENDING_DESTINATION_APPROVAL'].includes(status);
  const showRecall      = canRecall && status === 'APPROVED_READY_FOR_FINALIZATION';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SuccessModal
        isOpen={!!successModal}
        onClose={() => setSuccessModal(null)}
        title={successModal?.title ?? ''}
        message={successModal?.message}
      />

      {showRejectModal && (
        <ReasonModal
          title="Reject Movement"
          description="Provide a reason for rejection. The requester will see this."
          confirmLabel="Confirm Rejection"
          confirmClass="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          processingLabel="Rejecting…"
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          isLoading={actionLoading}
        />
      )}

      {showRecallModal && (
        <ReasonModal
          title="Recall Approved Movement"
          description="This will halt the movement before stock is updated. Provide a reason — it will be recorded in the audit trail."
          confirmLabel="Confirm Recall"
          confirmClass="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          processingLabel="Recalling…"
          onConfirm={handleRecall}
          onCancel={() => setShowRecallModal(false)}
          isLoading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/movements')}
            className="mb-2 text-sm text-primary-600 hover:underline"
          >
            ← All Movements
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{movement.movementNumber}</h2>
          <p className="mt-1 text-sm text-gray-500">Created {fmtDate(movement.createdAt)}</p>
        </div>
        <div className="mt-1">
          <MovementStatusBadge status={status} />
        </div>
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}

      {/* Route info */}
      <div className="card p-5">
        <h3 className="mb-4 text-base font-semibold text-gray-800">Movement Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Origin</p>
            <p className="mt-1 font-medium text-gray-900">
              {movement.originLocation?.code} – {movement.originLocation?.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Destination</p>
            <p className="mt-1 font-medium text-gray-900">
              {movement.destinationLocation?.code} – {movement.destinationLocation?.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Requested By</p>
            <p className="mt-1 text-gray-800">{movement.requestedBy?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
            <p className="mt-1 text-gray-800">{movement.notes || <span className="italic text-gray-400">None</span>}</p>
          </div>
          {status === 'REJECTED' && movement.rejectionReason && (
            <div className="col-span-2 rounded-md bg-red-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Rejection Reason</p>
              <p className="mt-1 text-sm text-red-800">{movement.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-800">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Item</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">SKU</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Qty Moved</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Origin Before</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Origin After</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Dest Before</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Dest After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {details.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{d.goods?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.goods?.productId ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                    {fmt(d.quantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{fmt(d.originQtyBefore)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{fmt(d.originQtyAfter)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{fmt(d.destinationQtyBefore)}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-700 tabular-nums">{fmt(d.destinationQtyAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit trail */}
      <div className="card p-5">
        <h3 className="mb-4 text-base font-semibold text-gray-800">Audit Trail</h3>
        <div className="space-y-2">
          <AuditRow label="Requested by" user={movement.requestedBy} date={movement.createdAt} />
          <AuditRow label="Head approved by" user={movement.headApprovedBy} date={movement.headApprovedAt} />
          <AuditRow label="Dest. approved by" user={movement.destApprovedBy} date={movement.destApprovedAt} />
          <AuditRow label="Finalized by" user={movement.finalizedBy} date={movement.finalizedAt} />
          <AuditRow label="Rejected by" user={movement.rejectedBy} date={movement.rejectedAt} />
        </div>
      </div>

      {/* Action buttons */}
      {(showApproveHead || showApproveDest || showFinalize || showReject || showRecall) && (
        <div className="card flex flex-wrap items-center gap-3 p-5">
          <span className="text-sm font-medium text-gray-600 mr-2">Actions:</span>

          {showApproveHead && (
            <button
              className="btn btn-primary"
              onClick={handleApproveHead}
              disabled={actionLoading}
            >
              {actionLoading ? <Spinner size="sm" /> : 'Approve (Warehouse Head)'}
            </button>
          )}

          {showApproveDest && (
            <button
              className="btn btn-primary"
              onClick={handleApproveDest}
              disabled={actionLoading}
            >
              {actionLoading ? <Spinner size="sm" /> : 'Approve (Destination)'}
            </button>
          )}

          {showFinalize && (
            <button
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handleFinalize}
              disabled={actionLoading}
            >
              {actionLoading ? <Spinner size="sm" /> : 'Finalize & Update Stock'}
            </button>
          )}

          {/* Recall: only shown at APPROVED_READY_FOR_FINALIZATION — halts the
              movement before stock is touched. Mutually exclusive with Reject. */}
          {showRecall && (
            <button
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              onClick={() => setShowRecallModal(true)}
              disabled={actionLoading}
            >
              Recall
            </button>
          )}

          {/* Reject: only shown at PENDING_* stages — before full approval. */}
          {showReject && (
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
