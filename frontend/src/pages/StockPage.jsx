import { useState, useEffect, useCallback } from 'react';
import { getStocks } from '@/services/stockService';
import { getGoods } from '@/services/goodsService';
import { getLocations } from '@/services/locationService';

export default function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [goodsList, setGoodsList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [filterGoods, setFilterGoods] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterGoods) params.goods_id = filterGoods;
      if (filterLocation) params.location_id = filterLocation;
      const res = await getStocks(params);
      setStocks(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [filterGoods, filterLocation]);

  useEffect(() => {
    getGoods({ isActive: true }).then((r) => setGoodsList(r.data || [])).catch(() => {});
    getLocations({ isActive: true }).then((r) => setLocationsList(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Stock Levels</h2>
        <p className="mt-1 text-sm text-gray-500">Current stock quantity per goods per location.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="input w-auto min-w-[180px]"
          value={filterGoods}
          onChange={(e) => setFilterGoods(e.target.value)}
        >
          <option value="">All Goods</option>
          {goodsList.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          className="input w-auto min-w-[180px]"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locationsList.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button onClick={load} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : stocks.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No stock records found. Stock is created automatically when adjustments are approved.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Goods', 'SKU', 'Location', 'Quantity', 'Unit', 'Last Updated'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stocks.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.goods?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{s.goods?.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.location?.name ?? '—'} <span className="text-gray-400 text-xs">({s.location?.code})</span></td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <span className={parseFloat(s.quantity) === 0 ? 'text-red-500' : 'text-gray-900'}>
                      {parseFloat(s.quantity).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.goods?.unit || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.last_updated_at ? new Date(s.last_updated_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
