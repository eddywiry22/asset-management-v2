import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as movementService from '@/services/movementService';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';

const emptyRow = () => ({ _key: Math.random(), itemId: '', quantity: '' });

const fmt = (val) => {
  if (val === null || val === undefined) return <span className="text-gray-400 italic">No stock</span>;
  return parseFloat(val).toLocaleString(undefined, { maximumFractionDigits: 4 });
};

export default function MovementNewPage() {
  const navigate = useNavigate();

  // Reference data
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [originStocks, setOriginStocks] = useState([]);
  const [destStocks, setDestStocks] = useState([]);

  // Form state
  const [originLocationId, setOriginLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([emptyRow()]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOriginStock, setLoadingOriginStock] = useState(false);
  const [loadingDestStock, setLoadingDestStock] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load reference data on mount
  useEffect(() => {
    Promise.all([movementService.listLocations(), movementService.listItems()])
      .then(([locRes, itemRes]) => {
        setLocations(locRes.data.data);
        setItems(itemRes.data.data);
      })
      .catch(() => {});
  }, []);

  // Load origin stocks when origin location changes
  useEffect(() => {
    if (!originLocationId) { setOriginStocks([]); return; }
    setLoadingOriginStock(true);
    movementService.getStocksByLocation(originLocationId)
      .then((res) => setOriginStocks(res.data.data))
      .catch(() => setOriginStocks([]))
      .finally(() => setLoadingOriginStock(false));
  }, [originLocationId]);

  // Load dest stocks when destination location changes
  useEffect(() => {
    if (!destinationLocationId) { setDestStocks([]); return; }
    setLoadingDestStock(true);
    movementService.getStocksByLocation(destinationLocationId)
      .then((res) => setDestStocks(res.data.data))
      .catch(() => setDestStocks([]))
      .finally(() => setLoadingDestStock(false));
  }, [destinationLocationId]);

  // ---------------------------------------------------------------------------
  // Preview helpers (computed live from stock data)
  // ---------------------------------------------------------------------------

  const getStockQty = useCallback((stockList, itemId) => {
    const s = stockList.find((s) => String(s.itemId) === String(itemId));
    return s ? parseFloat(s.quantity) : null;
  }, []);

  const getPreview = useCallback(
    (row) => {
      if (!originLocationId || !destinationLocationId || !row.itemId || !row.quantity) return null;
      const qty = parseFloat(row.quantity);
      if (!qty || qty <= 0) return null;

      const originBefore = getStockQty(originStocks, row.itemId);
      const destBefore = getStockQty(destStocks, row.itemId);

      return {
        originQtyBefore: originBefore,
        originQtyAfter: originBefore !== null ? originBefore - qty : null,
        destinationQtyBefore: destBefore !== null ? destBefore : 0,
        destinationQtyAfter: (destBefore !== null ? destBefore : 0) + qty,
        noOriginStock: originBefore === null,
        noDestStock: destBefore === null,
        insufficient: originBefore !== null && originBefore - qty < 0,
      };
    },
    [originLocationId, destinationLocationId, originStocks, destStocks, getStockQty]
  );

  // ---------------------------------------------------------------------------
  // Row management
  // ---------------------------------------------------------------------------

  const updateRow = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
    setFieldErrors((prev) => ({ ...prev, [`${key}-${field}`]: null }));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (key) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r._key !== key));
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = () => {
    const errors = {};
    if (!originLocationId) errors.originLocationId = 'Required';
    if (!destinationLocationId) errors.destinationLocationId = 'Required';
    if (originLocationId && destinationLocationId && originLocationId === destinationLocationId) {
      errors.destinationLocationId = 'Destination must differ from origin';
    }

    rows.forEach((row) => {
      if (!row.itemId) errors[`${row._key}-itemId`] = 'Select an item';
      if (!row.quantity || parseFloat(row.quantity) <= 0)
        errors[`${row._key}-quantity`] = 'Must be > 0';

      const preview = getPreview(row);
      if (preview?.noOriginStock) errors[`${row._key}-itemId`] = 'No stock at origin';
      if (preview?.insufficient) errors[`${row._key}-quantity`] = 'Exceeds available stock';
    });

    // Duplicate item check
    const itemIds = rows.map((r) => r.itemId).filter(Boolean);
    const seen = new Set();
    itemIds.forEach((id) => {
      if (seen.has(id)) errors.duplicateItems = 'Duplicate items in the list';
      seen.add(id);
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setWarnings([]);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        originLocationId: Number(originLocationId),
        destinationLocationId: Number(destinationLocationId),
        notes: notes.trim() || null,
        items: rows.map((r) => ({ itemId: Number(r.itemId), quantity: parseFloat(r.quantity) })),
      };

      const res = await movementService.createMovement(payload);
      const { movement, warnings: w } = res.data.data;

      if (w && w.length > 0) {
        setWarnings(w);
        setTimeout(() => navigate(`/movements/${movement.id}`), 2500);
      } else {
        navigate(`/movements/${movement.id}`);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create movement request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasPreviewData = originLocationId && destinationLocationId;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Movement Request</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a goods movement request between two locations.
        </p>
      </div>

      {submitError && (
        <Alert type="error" message={submitError} onClose={() => setSubmitError(null)} />
      )}
      {warnings.map((w, i) => (
        <Alert key={i} type="warning" message={w} />
      ))}
      {fieldErrors.duplicateItems && (
        <Alert type="error" message={fieldErrors.duplicateItems} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Locations */}
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Movement Route</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Origin */}
            <div>
              <label className="label" htmlFor="originLocation">
                Origin Location <span className="text-red-500">*</span>
              </label>
              <select
                id="originLocation"
                className={`input ${fieldErrors.originLocationId ? 'border-red-400' : ''}`}
                value={originLocationId}
                onChange={(e) => {
                  setOriginLocationId(e.target.value);
                  setFieldErrors((p) => ({ ...p, originLocationId: null }));
                }}
              >
                <option value="">Select origin...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} – {l.name}
                  </option>
                ))}
              </select>
              {fieldErrors.originLocationId && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.originLocationId}</p>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="label" htmlFor="destinationLocation">
                Destination Location <span className="text-red-500">*</span>
              </label>
              <select
                id="destinationLocation"
                className={`input ${fieldErrors.destinationLocationId ? 'border-red-400' : ''}`}
                value={destinationLocationId}
                onChange={(e) => {
                  setDestinationLocationId(e.target.value);
                  setFieldErrors((p) => ({ ...p, destinationLocationId: null }));
                }}
              >
                <option value="">Select destination...</option>
                {locations
                  .filter((l) => String(l.id) !== String(originLocationId))
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} – {l.name}
                    </option>
                  ))}
              </select>
              {fieldErrors.destinationLocationId && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.destinationLocationId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Items to Move</h3>
            {(loadingOriginStock || loadingDestStock) && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Spinner size="sm" /> Loading stock data…
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left font-semibold text-gray-600">Item</th>
                  <th className="pb-2 text-left font-semibold text-gray-600">Qty to Move</th>
                  {hasPreviewData && (
                    <>
                      <th className="pb-2 text-right font-semibold text-gray-500">Origin Before</th>
                      <th className="pb-2 text-right font-semibold text-gray-500">Origin After</th>
                      <th className="pb-2 text-right font-semibold text-gray-500">Dest Before</th>
                      <th className="pb-2 text-right font-semibold text-gray-500">Dest After</th>
                    </>
                  )}
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const preview = getPreview(row);
                  const rowItemError = fieldErrors[`${row._key}-itemId`];
                  const rowQtyError = fieldErrors[`${row._key}-quantity`];

                  return (
                    <tr key={row._key} className="align-top">
                      {/* Item select */}
                      <td className="py-2 pr-3">
                        <select
                          className={`input text-sm ${rowItemError ? 'border-red-400' : ''}`}
                          value={row.itemId}
                          onChange={(e) => updateRow(row._key, 'itemId', e.target.value)}
                        >
                          <option value="">Select item…</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.sku} – {item.name} ({item.unit})
                            </option>
                          ))}
                        </select>
                        {rowItemError && (
                          <p className="mt-0.5 text-xs text-red-500">{rowItemError}</p>
                        )}
                        {preview?.noDestStock && (
                          <p className="mt-0.5 text-xs text-amber-600">
                            ⚠ No dest stock – will be auto-created
                          </p>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          placeholder="0"
                          className={`input w-28 text-sm ${rowQtyError ? 'border-red-400' : ''}`}
                          value={row.quantity}
                          onChange={(e) => updateRow(row._key, 'quantity', e.target.value)}
                        />
                        {rowQtyError && (
                          <p className="mt-0.5 text-xs text-red-500">{rowQtyError}</p>
                        )}
                      </td>

                      {/* Preview columns */}
                      {hasPreviewData && (
                        <>
                          <td className={`py-2 pr-3 text-right tabular-nums ${preview?.noOriginStock ? 'text-red-500' : 'text-gray-700'}`}>
                            {preview ? fmt(preview.originQtyBefore) : '—'}
                          </td>
                          <td className={`py-2 pr-3 text-right tabular-nums ${preview?.insufficient ? 'font-semibold text-red-600' : 'text-gray-700'}`}>
                            {preview ? fmt(preview.originQtyAfter) : '—'}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums text-gray-700">
                            {preview ? fmt(preview.destinationQtyBefore) : '—'}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums font-medium text-green-700">
                            {preview ? fmt(preview.destinationQtyAfter) : '—'}
                          </td>
                        </>
                      )}

                      {/* Remove */}
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row._key)}
                          disabled={rows.length === 1}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                          title="Remove row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            + Add item
          </button>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label" htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            rows={3}
            className="input"
            placeholder="Add any notes about this movement…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/movements')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Submitting…
              </span>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
