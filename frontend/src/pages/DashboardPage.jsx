import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';
import Alert from '@/components/Alert';
import StatsCard from '@/components/dashboard/StatsCard';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import StockBarChart from '@/components/dashboard/StockBarChart';
import MovementLineChart from '@/components/dashboard/MovementLineChart';
import {
  getStockOverview,
  getMovementReport,
  getMovementRequestSummary,
  getStockChartData,
  getMovementTrends,
  getLocations,
  getGoods,
  exportStockCsv,
  exportMovementsCsv,
} from '@/services/dashboardService';

const TYPE_BADGE = {
  in: 'bg-green-100 text-green-700',
  out: 'bg-red-100 text-red-700',
  transfer: 'bg-blue-100 text-blue-700',
};

const STATUS_BADGE = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-500',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ok: 'bg-green-100 text-green-700',
  low: 'bg-yellow-100 text-yellow-700',
  out_of_stock: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
};

function Badge({ value, map }) {
  const cls = map[value] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {value?.replace(/_/g, ' ')}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({});
  const [locations, setLocations] = useState([]);
  const [goods, setGoods] = useState([]);

  const [stockOverview, setStockOverview] = useState(null);
  const [movementReport, setMovementReport] = useState(null);
  const [requestSummary, setRequestSummary] = useState(null);
  const [stockChartData, setStockChartData] = useState([]);
  const [movementTrends, setMovementTrends] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);

  // Load filter options once
  useEffect(() => {
    Promise.all([getLocations(), getGoods()])
      .then(([locs, gs]) => {
        setLocations(locs);
        setGoods(gs);
      })
      .catch(() => {});
  }, []);

  // BUG-R8-08: skip API calls when the date range exceeds 365 days
  const rangeExceeded = (() => {
    if (!filters.startDate || !filters.endDate) return false;
    return Math.round((new Date(filters.endDate) - new Date(filters.startDate)) / 86400000) > 365;
  })();

  const loadData = useCallback(async () => {
    if (rangeExceeded) return;
    setLoading(true);
    setError(null);
    try {
      const [overview, movements, requests, stockChart, trends] = await Promise.all([
        getStockOverview(filters),
        getMovementReport(filters),
        getMovementRequestSummary(filters),
        getStockChartData(filters),
        getMovementTrends(filters),
      ]);
      setStockOverview(overview);
      setMovementReport(movements);
      setRequestSummary(requests);
      setStockChartData(stockChart);
      setMovementTrends(trends);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [filters, rangeExceeded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'stock') await exportStockCsv(filters);
      else await exportMovementsCsv(filters);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back,{' '}
            <span className="font-medium text-gray-700">{user?.name}</span>. Here&rsquo;s
            your stock and movement overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary text-sm"
            onClick={() => handleExport('stock')}
            disabled={exporting === 'stock'}
          >
            {exporting === 'stock' ? 'Exporting…' : '↓ Stock CSV'}
          </button>
          <button
            className="btn btn-secondary text-sm"
            onClick={() => handleExport('movements')}
            disabled={exporting === 'movements'}
          >
            {exporting === 'movements' ? 'Exporting…' : '↓ Movements CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        locations={locations}
        goods={goods}
      />

      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* ── Stock Overview ── */}
          <section>
            <h3 className="mb-3 text-base font-semibold text-gray-800">Stock Overview</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatsCard
                label="Total Items"
                value={stockOverview?.summary.totalItems ?? 0}
                icon="◫"
                colorClass="bg-blue-50 text-blue-700"
              />
              <StatsCard
                label="Total Quantity"
                value={stockOverview?.summary.totalQuantity?.toLocaleString() ?? 0}
                icon="⊡"
                colorClass="bg-indigo-50 text-indigo-700"
              />
              <StatsCard
                label="Out of Stock"
                value={stockOverview?.summary.outOfStockItems ?? 0}
                icon="✕"
                colorClass="bg-red-50 text-red-700"
              />
            </div>
          </section>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Stock by Good (Bar)</h3>
              <StockBarChart data={stockChartData} />
            </div>
            <div className="card p-5">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Movement Trends (Line)</h3>
              <MovementLineChart data={movementTrends} />
            </div>
          </div>

          {/* ── Movement Request Summary ── */}
          <section>
            <h3 className="mb-3 text-base font-semibold text-gray-800">Movement Request Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard
                label="Total Requests"
                value={requestSummary?.summary.total ?? 0}
                icon="◈"
                colorClass="bg-gray-100 text-gray-700"
              />
              <StatsCard
                label="Pending"
                value={requestSummary?.summary.pending ?? 0}
                icon="◷"
                colorClass="bg-yellow-50 text-yellow-700"
              />
              <StatsCard
                label="Approved"
                value={requestSummary?.summary.approved ?? 0}
                icon="✓"
                colorClass="bg-green-50 text-green-700"
              />
              <StatsCard
                label="Rejected"
                value={requestSummary?.summary.rejected ?? 0}
                icon="✕"
                colorClass="bg-red-50 text-red-700"
              />
            </div>

            {requestSummary?.requests?.length > 0 && (
              <div className="card mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Date', 'Type', 'Good', 'From', 'To', 'Qty', 'Status'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requestSummary.requests.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{r.date}</td>
                          <td className="px-4 py-3">
                            <Badge value={r.type} map={TYPE_BADGE} />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{r.good?.name}</td>
                          <td className="px-4 py-3 text-gray-500">{r.fromLocation?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{r.toLocation?.name || '—'}</td>
                          <td className="px-4 py-3 font-semibold">{r.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge value={r.status} map={STATUS_BADGE} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── Movement Report ── */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-gray-800">
                Movement Report
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (In: {movementReport?.summary.totalIn?.toLocaleString() ?? 0} | Out:{' '}
                  {movementReport?.summary.totalOut?.toLocaleString() ?? 0} | Transfer:{' '}
                  {movementReport?.summary.totalTransfer?.toLocaleString() ?? 0})
                </span>
              </h3>
            </div>

            <div className="card overflow-hidden">
              {movementReport?.movements?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Date', 'Type', 'Good', 'From', 'To', 'Qty', 'Status', 'Notes'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {movementReport.movements.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{m.date}</td>
                          <td className="px-4 py-3">
                            <Badge value={m.type} map={TYPE_BADGE} />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{m.goods?.name}</td>
                          <td className="px-4 py-3 text-gray-500">{m.fromLocation?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{m.toLocation?.name || '—'}</td>
                          <td className="px-4 py-3 font-semibold">{m.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge value={m.status} map={STATUS_BADGE} />
                          </td>
                          <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                            {m.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="text-4xl">◈</span>
                  <p className="mt-3 text-sm">No movements found for the selected filters.</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Stock Table ── */}
          <section>
            <h3 className="mb-3 text-base font-semibold text-gray-800">Stock Details</h3>
            <div className="card overflow-hidden">
              {stockOverview?.stocks?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Location', 'Goods', 'Product ID', 'Qty', 'Stock Status', 'Goods Status'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stockOverview.stocks.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{s.location?.name}</td>
                          <td className="px-4 py-3 text-gray-700">{s.goods?.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.goods?.productId}</td>
                          <td className="px-4 py-3 font-semibold">{s.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge value={s.status} map={STATUS_BADGE} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge value={String(s.goods?.status || '').toLowerCase()} map={STATUS_BADGE} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="text-4xl">◫</span>
                  <p className="mt-3 text-sm">No stock data available.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
