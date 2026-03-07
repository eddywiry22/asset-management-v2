import api from './api';

export const listMovements = () => api.get('/movements');

export const createMovement = (data) => api.post('/movements', data);

export const approveMovement = (id) => api.put(`/movements/${id}/approve`);

export const rejectMovement = (id, rejection_reason) =>
  api.put(`/movements/${id}/reject`, { rejection_reason });

export const getMovementAuditLogs = (id) => api.get(`/movements/${id}/audit-logs`);
