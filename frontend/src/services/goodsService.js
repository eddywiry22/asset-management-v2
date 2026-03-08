import api from './api';

/**
 * Fetch all goods, with optional filters.
 * @param {{ status?: string, category?: string }} params
 */
export const listGoods = async (params = {}) => {
  const { data } = await api.get('/goods', { params });
  return data; // { success, message, data: [...] }
};

/**
 * Fetch only ACTIVE goods (for use in movement request selectors).
 */
export const listActiveGoods = async () => {
  const { data } = await api.get('/goods/active');
  return data;
};

/**
 * Fetch a single goods record by id.
 * @param {number} id
 */
export const getGoods = async (id) => {
  const { data } = await api.get(`/goods/${id}`);
  return data;
};

/**
 * Create a new goods record.
 * @param {{ product_id: string, name: string, category: string, vendor: string, description?: string, status?: string }} payload
 */
export const createGoods = async (payload) => {
  const { data } = await api.post('/goods', payload);
  return data;
};

/**
 * Update an existing goods record.
 * @param {number} id
 * @param {object} payload
 */
export const updateGoods = async (id, payload) => {
  const { data } = await api.put(`/goods/${id}`, payload);
  return data;
};

/**
 * Delete a goods record.
 * @param {number} id
 */
export const deleteGoods = async (id) => {
  const { data } = await api.delete(`/goods/${id}`);
  return data;
};

/**
 * Get impact summary for a goods record (affected stocks + active movements).
 * Used for the deactivation confirmation modal.
 * @param {number} id
 */
export const getGoodsImpact = async (id) => {
  const { data } = await api.get(`/goods/${id}/impact`);
  return data;
};
