import api from './api';

export const getNotificationCount = () =>
  api.get('/movement-requests/notifications/count');

export const getAll = (params = {}) =>
  api.get('/movement-requests', { params });

export const create = (data) =>
  api.post('/movement-requests', data);

export const updateStatus = (id, action, rejection_reason) =>
  api.patch(`/movement-requests/${id}/status`, { action, rejection_reason });
