import api from './api';

const userService = {
  list: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  impact: (id) => api.get(`/users/${id}/impact`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export default userService;
