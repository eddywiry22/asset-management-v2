import api from './api';

export const fetchAuditLogs = async (params = {}) => {
  const { data } = await api.get('/audit-logs', { params });
  return data;
};

export const fetchAuditModules = async () => {
  const { data } = await api.get('/audit-logs/modules');
  return data;
};
