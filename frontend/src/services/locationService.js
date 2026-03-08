import api from './api';

const getAll = (params = {}) => api.get('/locations', { params });

const getById = (id) => api.get(`/locations/${id}`);

const create = (data) => api.post('/locations', data);

const update = (id, data) => api.patch(`/locations/${id}`, data);

const remove = (id) => api.delete(`/locations/${id}`);

const getImpact = (id) => api.get(`/locations/${id}/impact`);
const getLogs = (id) => api.get(`/locations/${id}/logs`);

export default { getAll, getById, getImpact, create, update, remove, getLogs };
