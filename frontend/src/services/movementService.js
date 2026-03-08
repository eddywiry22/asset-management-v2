import api from './api';

export const listMovements = (params) => api.get('/movements', { params });
export const getMovement = (id) => api.get(`/movements/${id}`);
export const previewMovement = (data) => api.post('/movements/preview', data);
export const createMovement = (data) => api.post('/movements', data);
export const approveByHead = (id) => api.post(`/movements/${id}/approve-head`);
export const approveByDestination = (id) => api.post(`/movements/${id}/approve-dest`);
export const finalizeMovement = (id) => api.post(`/movements/${id}/finalize`);
export const rejectMovement = (id, reason) => api.post(`/movements/${id}/reject`, { reason });
export const recallMovement = (id, reason) => api.post(`/movements/${id}/recall`, { reason });

export const listLocations = () => api.get('/locations');
export const listItems = () => api.get('/items');
export const getStocksByLocation = (locationId) => api.get('/stocks', { params: { locationId } });
