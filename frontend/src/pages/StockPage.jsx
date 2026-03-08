import { useState, useEffect, useCallback } from 'react';
import { getStocks } from '@/services/stockService';
import { listGoods } from '@/services/goodsService';
import locationService from '@/services/locationService';
import { getStockPeriodSummary } from '@/services/dashboardService';

// BUG-R8-09: Added date range filter and period summary view.
// When startDate/endDate are set the page shows a period summary table
// (qty_before, inbound, outbound, qty_after, total_requests) sourced from
// the new /api/dashboard/stock-period-summary endpoint.

const MAX_RANGE_DAYS = 365;

const daysBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.round((new Date(end) - new Date(start)) / 86400000);
};

const fmt = (n) =>
  n == null ? '—' : parseFloat(n).toLocaleString(undefined, { maximumFractionDigits: 4 });

export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [periodRows, setPeriodRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [goodsList, setGoodsList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [filterGoods, setFilterGoods] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const rangeError = (() => {
    const days = daysBetween(startDate, endDate);
    if (days > MAX_RANGE_DAYS) return `Date range cannot exceed ${MAX_RANGE_DAYS} days (currently ${days} days).`;
    return null;
  })();

  const hasDates = startDate || endDate;
  const isPeriodMode = !rangeError && hasDates;

  const load = useCallback(async () => {
    if (rangeError) return;
    setLoading(true);
    setError('');
    try {
      if (isPeriodMode) {
        const summaryParams = {};
        if (filterGoods) summaryParams.goodId = filterGoods;
        if (filterLocation) summaryParams.locationId = filterLocation;
        if (startDate) summaryParams.startDate = startDate;
        if (endDate) summaryParams.endDate = endDate;
        const rows = await getStockPeriodSummary(summaryParams);
        setPeriodRows(rows || []);
        setStocks([]);
      } else {
        const params = {};
        if (filterGoods) params.goods_id = filterGoods;
        if (filterLocation) params.location_id = filterLocation;
        const res = await getStocks(params);
        setStocks(res.data || []);
        setPeriodRows([]);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [filterGoods, filterLocation, startDate, endDate, isPeriodMode, rangeError]);

  useEffect(() => {
    listGoods().then((r) => setGoodsList(r.data || [])).catch(() => {});
    locationService.getAll().then((r) => setLocationsList(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Stock Levels</h2>
        <p className="mt-1 text-sm text-gray-500">
          {isPeriodMode
            ? 'Period summary: inbound, outbound and quantity change for the selected date range.'
            : 'Current stock quantity per goods per location.'}
        </p>
      </div>

      {/* Filters — BUG-R8-01 goods fix, BUG-R8-09 date filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-gray-600">Good</label>
            <select
              className="input py-1.5 text-sm"
              value={filterGoods}
              onChange={(e) => setFilterGoods(e.target.value)}
            >
              <option value="">All Goods</option>
              {goodsList.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-gray-600">Location</label>
            <select
              className="input py-1.5 text-sm"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locationsList.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">From date</label>
            <input
              type="date"
              className="input py-1.5 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">To date</label>
            <input
              type="date"
              className="input py-1.5 text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            onClick={load}
            disabled={!!rangeError}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 self-end"
          >
            Refresh
          </button>

          {hasDates && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 self-end"
            >
              Clear dates
            </button>
          )}
        </div>

        {rangeError && (
          <p className="text-xs font-medium text-red-600">{rangeError}</p>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : isPeriodMode ? (
          /* Period summary table — BUG-R8-07 / BUG-R8-09 */
          periodRows.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No movement activity found for the selected period and filters.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-indigo-50">
                <tr>
                  {['Goods', 'Product ID', 'Location', 'Qty Before', 'Inbound', 'Outbound', 'Adjustment', 'Qty After (current)', 'Total Requests'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodRows.map((row, i) => {
                  const adj = row.adjustmentNet ?? 0;
                  const adjLabel = adj === 0 ? '—' : (adj > 0 ? `+${fmt(adj)}` : fmt(adj));
                  const adjClass = adj > 0 ? 'text-blue-600 font-medium' : adj < 0 ? 'text-orange-600 font-medium' : 'text-gray-400';
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.goods?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.goods?.productId ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.location?.name ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-gray-700">{fmt(row.qtyBefore)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-green-700">+{fmt(row.inbound)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-red-600">-{fmt(row.outbound)}</td>
                      <td className={`px-4 py-3 tabular-nums ${adjClass}`}>{adjLabel}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold">
                        <span className={parseFloat(row.qtyAfter) === 0 ? 'text-red-500' : 'text-gray-900'}>
                          {fmt(row.qtyAfter)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.totalMovementRequests}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          /* Current-stock snapshot table */
          stocks.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No stock records found. Stock is created automatically when adjustments are approved.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Goods', 'Product ID', 'Location', 'Quantity', 'Last Updated'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stocks.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.goods?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.goods?.productId ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.location?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={parseFloat(s.quantity) === 0 ? 'text-red-500' : 'text-gray-900'}>
                        {fmt(s.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.last_updated_at ? new Date(s.last_updated_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
