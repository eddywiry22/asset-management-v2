import api from './api';

export const getStocks = async (params = {}) => {
  const { data } = await api.get('/stocks', { params });
  return data;
};

export const getStockById = async (id) => {
  const { data } = await api.get(`/stocks/${id}`);
  return data;
};
