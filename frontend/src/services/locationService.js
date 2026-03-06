import api from './api';

export const getLocations = async (params = {}) => {
  const { data } = await api.get('/locations', { params });
  return data;
};

export const getLocationById = async (id) => {
  const { data } = await api.get(`/locations/${id}`);
  return data;
};

export const createLocation = async (payload) => {
  const { data } = await api.post('/locations', payload);
  return data;
};

export const updateLocation = async (id, payload) => {
  const { data } = await api.put(`/locations/${id}`, payload);
  return data;
};

export const deleteLocation = async (id) => {
  const { data } = await api.delete(`/locations/${id}`);
  return data;
};
