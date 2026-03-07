import { useEffect, useRef, useState } from 'react';

/**
 * Modal that collects a mandatory rejection reason before confirming a rejection.
 *
 * @param {{ isOpen: boolean, onClose: () => void, onConfirm: (reason: string) => void, isLoading?: boolean }} props
 */
export default function RejectionModal({ isOpen, onClose, onConfirm, isLoading = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      // Focus textarea on next tick
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('Please provide a reason of at least 5 characters.');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="rejection-modal-title"
    >
      {/* Panel – stop click propagation so clicking inside doesn't close */}
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="rejection-modal-title" className="text-base font-semibold text-gray-900">
            Reject Movement Request
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this movement request. This will be visible to
            the requester.
          </p>

          <div>
            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              ref={textareaRef}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              rows={4}
              placeholder="e.g. Insufficient documentation provided for this transfer..."
              disabled={isLoading}
              className={[
                'block w-full rounded-md border px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 focus:outline-none focus:ring-2',
                error
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
                'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70',
              ].join(' ')}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-400">{reason.trim().length} / 1000 characters</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || reason.trim().length < 5}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
