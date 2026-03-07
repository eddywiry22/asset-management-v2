const STATUS_CONFIG = {
  PENDING_HEAD_APPROVAL: {
    label: 'Pending Head Approval',
    className: 'bg-yellow-100 text-yellow-800',
  },
  PENDING_DESTINATION_APPROVAL: {
    label: 'Pending Dest. Approval',
    className: 'bg-blue-100 text-blue-800',
  },
  APPROVED_READY_FOR_FINALIZATION: {
    label: 'Ready to Finalize',
    className: 'bg-purple-100 text-purple-800',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
};

export default function MovementStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
