// BUG-R8-08: Added preset quick-range dropdown and 1-year maximum span validation.

const QUICK_RANGES = [
  { label: 'Custom', value: '' },
  { label: 'Last 1 week', value: '7d' },
  { label: 'Last 2 weeks', value: '14d' },
  { label: 'Last 3 weeks', value: '21d' },
  { label: 'Last 1 month', value: '1m' },
  { label: 'Last 2 months', value: '2m' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 4 months', value: '4m' },
  { label: 'Last 5 months', value: '5m' },
  { label: 'Last 6 months', value: '6m' },
];

const MAX_RANGE_DAYS = 365;

const presetToStartDate = (preset) => {
  if (!preset) return null;
  const d = new Date();
  if (preset.endsWith('d')) {
    d.setDate(d.getDate() - parseInt(preset, 10));
  } else if (preset.endsWith('m')) {
    d.setMonth(d.getMonth() - parseInt(preset, 10));
  }
  return d.toISOString().split('T')[0];
};

const toDateStr = (d) => new Date(d).toISOString().split('T')[0];

const daysBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.round((new Date(end) - new Date(start)) / 86400000);
};

export default function DashboardFilters({ filters, onChange, locations, goods }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const handleQuickRange = (preset) => {
    if (!preset) {
      onChange({ ...filters, startDate: undefined, endDate: undefined });
      return;
    }
    const today = toDateStr(new Date());
    const start = presetToStartDate(preset);
    onChange({ ...filters, startDate: start, endDate: today });
  };

  const activePreset = (() => {
    if (!filters.startDate || !filters.endDate) return '';
    const today = toDateStr(new Date());
    if (filters.endDate !== today) return '';
    for (const { value } of QUICK_RANGES) {
      if (!value) continue;
      if (presetToStartDate(value) === filters.startDate) return value;
    }
    return '';
  })();

  const rangeError = (() => {
    const days = daysBetween(filters.startDate, filters.endDate);
    if (days > MAX_RANGE_DAYS) {
      return `Date range cannot exceed ${MAX_RANGE_DAYS} days (currently ${days} days).`;
    }
    return null;
  })();

  const hasFilters = filters.locationId || filters.goodId || filters.startDate || filters.endDate;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Location */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-600">Location</label>
          <select
            className="input py-1.5 text-sm"
            value={filters.locationId || ''}
            onChange={(e) => handleChange('locationId', e.target.value)}
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Good */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-600">Good</label>
          <select
            className="input py-1.5 text-sm"
            value={filters.goodId || ''}
            onChange={(e) => handleChange('goodId', e.target.value)}
          >
            <option value="">All goods</option>
            {goods.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Quick range preset — BUG-R8-08 */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-600">Quick range</label>
          <select
            className="input py-1.5 text-sm"
            value={activePreset}
            onChange={(e) => handleQuickRange(e.target.value)}
          >
            {QUICK_RANGES.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Start date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From date</label>
          <input
            type="date"
            className="input py-1.5 text-sm"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        {/* End date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To date</label>
          <input
            type="date"
            className="input py-1.5 text-sm"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        {hasFilters && (
          <button
            className="btn btn-secondary py-1.5 text-sm self-end"
            onClick={() => onChange({})}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* 365-day max span error — BUG-R8-08 */}
      {rangeError && (
        <p className="text-xs font-medium text-red-600">{rangeError}</p>
      )}
    </div>
  );
}
