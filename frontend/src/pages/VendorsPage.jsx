import { useState, useEffect, useCallback } from 'react';
import vendorService from '@/services/vendorService';
import { useAuth } from '@/contexts/AuthContext';

const EMPTY_FORM = { name: '', contactPerson: '', email: '', phone: '', address: '' };

export default function VendorsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  const [vendors, setVendors] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const res = await vendorService.list({ search, page, limit: 15 });
      setVendors(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to load vendors' });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (vendor) => {
    setEditing(vendor);
    setForm({
      name: vendor.name,
      contactPerson: vendor.contactPerson ?? '',
      email: vendor.email ?? '',
      phone: vendor.phone ?? '',
      address: vendor.address ?? '',
    });
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
      const payload = {
        name: form.name,
        contactPerson: form.contactPerson || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
      };
      if (editing) {
        await vendorService.update(editing.id, payload);
        setAlert({ type: 'success', message: 'Vendor updated successfully' });
      } else {
        await vendorService.create(payload);
        setAlert({ type: 'success', message: 'Vendor created successfully' });
      }
      setModalOpen(false);
      setPage(1);
      fetchVendors();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await vendorService.remove(confirmDelete.id);
      setAlert({ type: 'success', message: `"${confirmDelete.name}" deleted` });
      setConfirmDelete(null);
      fetchVendors();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to delete vendor' });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">Manage asset vendors and suppliers</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New Vendor
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
          placeholder="Search vendors…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">Loading…</p>
        ) : vendors.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No vendors found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Contact Person</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-6 py-3 text-gray-600">{v.contactPerson || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{v.email || '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{v.phone || '—'}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    {canWrite && (
                      <button
                        className="text-primary-600 hover:underline text-sm"
                        onClick={() => openEdit(v)}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="text-red-600 hover:underline text-sm"
                        onClick={() => setConfirmDelete(v)}
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
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editing ? 'Edit Vendor' : 'New Vendor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Vendor name"
                  maxLength={150}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Person</label>
                  <input
                    className="input"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Full name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                    maxLength={20}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@vendor.com"
                  maxLength={150}
                />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea
                  className="input min-h-[72px] resize-y"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City, Country"
                  maxLength={2000}
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
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Delete Vendor</h2>
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
