/**
 * Inline alert / banner component.
 * @param {{ type?: 'error'|'success'|'warning'|'info', message: string, onClose?: () => void }} props
 */
export default function Alert({ type = 'error', message, onClose }) {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${styles[type]}`} role="alert">
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto shrink-0 opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
