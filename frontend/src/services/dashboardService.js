import api from './api';

const buildParams = (filters = {}) => {
  const params = {};
  if (filters.locationId) params.locationId = filters.locationId;
  if (filters.goodId) params.goodId = filters.goodId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return params;
};

export const getStockOverview = (filters) =>
  api.get('/dashboard/stock-overview', { params: buildParams(filters) }).then((r) => r.data.data);

export const getMovementReport = (filters) =>
  api.get('/dashboard/movement-report', { params: buildParams(filters) }).then((r) => r.data.data);

export const getMovementRequestSummary = (filters) =>
  api.get('/dashboard/movement-request-summary', { params: buildParams(filters) }).then((r) => r.data.data);

export const getStockChartData = (filters) =>
  api.get('/dashboard/stock-chart', { params: buildParams(filters) }).then((r) => r.data.data);

export const getMovementTrends = (filters) =>
  api.get('/dashboard/movement-trends', { params: buildParams(filters) }).then((r) => r.data.data);

export const getLocations = () =>
  api.get('/dashboard/locations').then((r) => r.data.data);

export const getGoods = () =>
  api.get('/dashboard/goods').then((r) => r.data.data);

/**
 * Trigger a CSV download via axios (so auth header is sent).
 */
const downloadCsv = async (url, params, filename) => {
  const response = await api.get(url, { params: buildParams(params), responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportStockCsv = (filters) =>
  downloadCsv('/dashboard/export/stock', filters, 'stock-report.csv');

export const exportMovementsCsv = (filters) =>
  downloadCsv('/dashboard/export/movements', filters, 'movement-report.csv');
