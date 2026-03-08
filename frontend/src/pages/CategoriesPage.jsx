import { useState, useEffect, useCallback } from 'react';
import categoryService from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';

const EMPTY_FORM = { name: '', description: '' };

export default function CategoriesPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'warehouse_head';
  const canDelete = user?.role === 'admin' || user?.role === 'warehouse_head';

  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message }

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null); // category to delete

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const res = await categoryService.list({ search, page, limit: 15 });
      setCategories(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '' });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      if (editing) {
        await categoryService.update(editing.id, form);
        setAlert({ type: 'success', message: 'Category updated successfully' });
      } else {
        await categoryService.create(form);
        setAlert({ type: 'success', message: 'Category created successfully' });
      }
      setModalOpen(false);
      setPage(1);
      fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await categoryService.remove(confirmDelete.id);
      setAlert({ type: 'success', message: `"${confirmDelete.name}" deleted` });
      setConfirmDelete(null);
      fetchCategories();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to delete category' });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage asset categories</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New Category
          </button>
        )}
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No categories found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-6 py-3 text-gray-600">{cat.description || '—'}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    {canWrite && (
                      <button
                        className="text-primary-600 hover:underline text-sm"
                        onClick={() => openEdit(cat)}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="text-red-600 hover:underline text-sm"
                        onClick={() => setConfirmDelete(cat)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <div className="space-x-2">
            <button
              className="btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editing ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Category name"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                  maxLength={1000}
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" className="btn" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Delete Category</h2>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
