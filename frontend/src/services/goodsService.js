import api from './api';

export const getGoods = async (params = {}) => {
  const { data } = await api.get('/goods', { params });
  return data;
};

export const getGoodsById = async (id) => {
  const { data } = await api.get(`/goods/${id}`);
  return data;
};

export const createGoods = async (payload) => {
  const { data } = await api.post('/goods', payload);
  return data;
};

export const updateGoods = async (id, payload) => {
  const { data } = await api.put(`/goods/${id}`, payload);
  return data;
};

export const deleteGoods = async (id) => {
  const { data } = await api.delete(`/goods/${id}`);
  return data;
};
