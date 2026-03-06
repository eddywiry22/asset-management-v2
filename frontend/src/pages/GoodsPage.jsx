import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Alert from '@/components/Alert';
import Spinner from '@/components/Spinner';
import {
  listGoods,
  createGoods,
  updateGoods,
  deleteGoods,
} from '@/services/goodsService';

const EMPTY_FORM = {
  product_id: '',
  name: '',
  category: '',
  vendor: '',
  description: '',
  status: 'ACTIVE',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-red-100 text-red-800',
};

// ─── GoodsForm (create / edit) ───────────────────────────────────────────────

function GoodsForm({ initial, onSave, onCancel, isSubmitting, serverError }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const isEdit = Boolean(initial);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.product_id.trim()) errs.product_id = 'Product ID is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.category.trim()) errs.category = 'Category is required';
    if (!form.vendor.trim()) errs.vendor = 'Vendor is required';
    if (!['ACTIVE', 'INACTIVE'].includes(form.status)) errs.status = 'Invalid status';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && <Alert type="error" message={serverError} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Product ID */}
        <div>
          <label className="label" htmlFor="product_id">
            Product ID <span className="text-red-500">*</span>
          </label>
          <input
            id="product_id"
            name="product_id"
            type="text"
            className={`input ${fieldErrors.product_id ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.product_id}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. PROD-001"
          />
          {fieldErrors.product_id && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.product_id}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="label" htmlFor="name">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`input ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.name}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Office Chair"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="label" htmlFor="category">
            Category <span className="text-red-500">*</span>
          </label>
          <input
            id="category"
            name="category"
            type="text"
            className={`input ${fieldErrors.category ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.category}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Furniture"
          />
          {fieldErrors.category && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p>
          )}
        </div>

        {/* Vendor */}
        <div>
          <label className="label" htmlFor="vendor">
            Vendor <span className="text-red-500">*</span>
          </label>
          <input
            id="vendor"
            name="vendor"
            type="text"
            className={`input ${fieldErrors.vendor ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.vendor}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. IKEA"
          />
          {fieldErrors.vendor && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.vendor}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="label" htmlFor="status">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            className={`input ${fieldErrors.status ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.status}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          {fieldErrors.status && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.status}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="input resize-none"
          value={form.description}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Optional description…"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Saving…
            </span>
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Create Goods'
          )}
        </button>
      </div>
    </form>
  );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ goods, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Delete Goods</h3>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">{goods.name}</span> (
          {goods.product_id})?{' '}
          <span className="text-red-600">This action cannot be undone.</span>
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button
            className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Deleting…
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GoodsPage ────────────────────────────────────────────────────────────────

export default function GoodsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // Panel state: null | 'create' | { ...goodsRecord } (edit)
  const [panel, setPanel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchGoods = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await listGoods();
      setGoods(res.data ?? []);
    } catch (err) {
      setPageError(err?.response?.data?.message ?? 'Failed to load goods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoods();
  }, [fetchGoods]);

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await createGoods(formData);
      setPanel(null);
      showToast('Goods created successfully');
      fetchGoods();
    } catch (err) {
      const res = err?.response?.data;
      if (res?.errors?.length) {
        setFormError(res.errors.map((e) => e.message).join(', '));
      } else {
        setFormError(res?.message ?? 'Failed to create goods');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const handleUpdate = async (formData) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await updateGoods(panel.id, formData);
      setPanel(null);
      showToast('Goods updated successfully');
      fetchGoods();
    } catch (err) {
      const res = err?.response?.data;
      if (res?.errors?.length) {
        setFormError(res.errors.map((e) => e.message).join(', '));
      } else {
        setFormError(res?.message ?? 'Failed to update goods');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGoods(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Goods deleted successfully');
      fetchGoods();
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Failed to delete goods', 'error');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreate = () => {
    setFormError('');
    setPanel('create');
  };

  const openEdit = (item) => {
    setFormError('');
    setPanel(item);
  };

  const closePanel = () => {
    setPanel(null);
    setFormError('');
  };

  const isFormOpen = panel !== null;
  const isEditMode = isFormOpen && panel !== 'create';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <Alert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          goods={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goods</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage product catalog. INACTIVE goods cannot be selected in movement requests.
          </p>
        </div>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Goods
          </button>
        )}
      </div>

      {/* Create / Edit panel */}
      {isFormOpen && (
        <div className="card p-6">
          <h3 className="mb-5 text-base font-semibold text-gray-900">
            {isEditMode ? 'Edit Goods' : 'Add New Goods'}
          </h3>
          <GoodsForm
            initial={isEditMode ? panel : undefined}
            onSave={isEditMode ? handleUpdate : handleCreate}
            onCancel={closePanel}
            isSubmitting={isSubmitting}
            serverError={formError}
          />
        </div>
      )}

      {/* Goods list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : pageError ? (
          <div className="p-6">
            <Alert type="error" message={pageError} onClose={() => setPageError('')} />
          </div>
        ) : goods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl">◫</span>
            <p className="mt-3 text-sm">No goods found.</p>
            <p className="text-xs">Click "Add Goods" to create the first record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Product ID', 'Name', 'Category', 'Vendor', 'Status', 'Actions'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {goods.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">
                      {item.product_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-gray-600">{item.vendor}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
