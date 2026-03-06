import api from './api';

/**
 * @param {{ email: string, password: string }} credentials
 */
export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data; // { success, message, data: { accessToken, refreshToken, user } }
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};
