export default function StatsCard({ label, value, icon, colorClass, subLabel }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
          {subLabel && <p className="mt-0.5 text-xs text-gray-400">{subLabel}</p>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ${colorClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
