import { useAuth } from '@/contexts/AuthContext';

const STAT_CARDS = [
  { label: 'Total Assets', value: '—', color: 'bg-blue-50 text-blue-700', icon: '◫' },
  { label: 'Active Assets', value: '—', color: 'bg-green-50 text-green-700', icon: '✓' },
  { label: 'Under Maintenance', value: '—', color: 'bg-yellow-50 text-yellow-700', icon: '⚙' },
  { label: 'Retired Assets', value: '—', color: 'bg-red-50 text-red-700', icon: '✕' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>. Here&rsquo;s
          an overview of your assets.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ label, value, color, icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ${color}`}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl">◈</span>
            <p className="mt-3 text-sm">No recent activity yet.</p>
            <p className="text-xs">Activity will appear here once modules are connected.</p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Asset Distribution</h3>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl">◑</span>
            <p className="mt-3 text-sm">No data available.</p>
            <p className="text-xs">Charts will render once asset data is available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
