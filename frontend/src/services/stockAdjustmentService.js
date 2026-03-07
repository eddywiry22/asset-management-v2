import api from './api';

export const getAdjustments = async (params = {}) => {
  const { data } = await api.get('/stock-adjustments', { params });
  return data;
};

export const getAdjustmentById = async (id) => {
  const { data } = await api.get(`/stock-adjustments/${id}`);
  return data;
};

export const requestAdjustment = async (payload) => {
  const { data } = await api.post('/stock-adjustments', payload);
  return data;
};

export const approveAdjustment = async (id, payload = {}) => {
  const { data } = await api.post(`/stock-adjustments/${id}/approve`, payload);
  return data;
};

export const rejectAdjustment = async (id, payload = {}) => {
  const { data } = await api.post(`/stock-adjustments/${id}/reject`, payload);
  return data;
};
