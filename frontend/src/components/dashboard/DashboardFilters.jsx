export default function DashboardFilters({ filters, onChange, locations, goods }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="card p-4">
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
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
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
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
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

        {/* Clear */}
        {(filters.locationId || filters.goodId || filters.startDate || filters.endDate) && (
          <button
            className="btn btn-secondary py-1.5 text-sm self-end"
            onClick={() => onChange({})}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
