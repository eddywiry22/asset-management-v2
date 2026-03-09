import { useState, useEffect, useCallback } from 'react';
import userService from '@/services/userService';
import locationService from '@/services/locationService';
import { useAuth } from '@/contexts/AuthContext';

const ROLES = ['admin', 'manager', 'viewer', 'warehouse_operator', 'warehouse_head'];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'viewer',
  phoneNumber: '',
  locationId: '',
  status: 'ACTIVE',
};

function roleLabel(role) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const canWrite = currentUser?.role === 'admin' || currentUser?.role === 'warehouse_head';
  const canDelete = currentUser?.role === 'admin';
  const canCreate = currentUser?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const params = { search, page, limit: 15 };
      if (roleFilter) params.role = roleFilter;
      const res = await userService.list(params);
      setUsers(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }, [search, page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    locationService.getAll({ status: 'ACTIVE' }).then((res) => {
      setLocations(res.data.data ?? []);
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phoneNumber: u.phoneNumber ?? '',
      locationId: u.locationId ?? '',
      status: u.status,
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
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    if (!form.email.trim()) { setFormError('Email is required'); return; }
    if (!editing && !form.password) { setFormError('Password is required'); return; }

    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        phoneNumber: form.phoneNumber || null,
        locationId: form.locationId ? Number(form.locationId) : null,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (!editing) payload.password = form.password;

      if (editing) {
        await userService.update(editing.id, payload);
        setAlert({ type: 'success', message: 'User updated successfully' });
      } else {
        await userService.create(payload);
        setAlert({ type: 'success', message: 'User created successfully' });
      }
      setModalOpen(false);
      setPage(1);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await userService.remove(confirmDelete.id);
      setAlert({ type: 'success', message: `"${confirmDelete.name}" deleted` });
      setConfirmDelete(null);
      setImpactData(null);
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message ?? 'Failed to delete user' });
      setConfirmDelete(null);
      setImpactData(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage system users and their roles</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={openCreate}>
            + New User
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Search users…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="input max-w-[180px]"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-3 text-gray-600">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{u.location?.name ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    {canWrite && (
                      <button
                        className="text-primary-600 hover:underline text-sm"
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && u.id !== currentUser?.id && (
                      <button
                        className="text-red-600 hover:underline text-sm"
                        onClick={async () => {
                          setConfirmDelete(u);
                          setImpactData(null);
                          setImpactLoading(true);
                          try {
                            const res = await userService.impact(u.id);
                            setImpactData(res.data.data);
                          } catch {}
                          finally { setImpactLoading(false); }
                        }}
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
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
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
              {editing ? 'Edit User' : 'New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="+1 555 000 0000"
                    maxLength={20}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  maxLength={150}
                />
              </div>
              <div>
                <label className="label">{editing ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? 'Enter new password to change' : 'Min. 8 characters'}
                  minLength={form.password ? 8 : undefined}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role *</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{roleLabel(r)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <select
                  className="input"
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                >
                  <option value="">No location assigned</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
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
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Delete User</h2>
            <p className="mb-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? The user record will be archived.
            </p>
            {impactLoading && <p className="mb-3 text-xs text-gray-400">Checking impact…</p>}
            {impactData && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {impactData.activeMovements > 0
                  ? <span><strong>{impactData.activeMovements}</strong> active movement(s) involve this user. Reassign them first.</span>
                  : <span>No active movements involve this user.</span>
                }
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button className="btn" onClick={() => { setConfirmDelete(null); setImpactData(null); }}>
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
