import api from './api';

const vendorService = {
  list: (params = {}) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  impact: (id) => api.get(`/vendors/${id}/impact`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  remove: (id) => api.delete(`/vendors/${id}`),
};

export default vendorService;
