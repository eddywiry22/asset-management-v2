const { Parser } = require('json2csv');
const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

const extractFilters = (query) => ({
  locationId: query.locationId ? parseInt(query.locationId, 10) : undefined,
  goodId: query.goodId ? parseInt(query.goodId, 10) : undefined,
  startDate: query.startDate || undefined,
  endDate: query.endDate || undefined,
});

const getStockOverview = async (req, res, next) => {
  try {
    const { locationId, goodId } = extractFilters(req.query);
    const data = await dashboardService.getStockOverview({ locationId, goodId });
    return success(res, data, 'Stock overview retrieved');
  } catch (err) {
    return next(err);
  }
};

const getMovementReport = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getMovementReport(filters);
    return success(res, data, 'Movement report retrieved');
  } catch (err) {
    return next(err);
  }
};

const getMovementRequestSummary = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getMovementRequestSummary(filters);
    return success(res, data, 'Movement request summary retrieved');
  } catch (err) {
    return next(err);
  }
};

const getStockChartData = async (req, res, next) => {
  try {
    const { locationId } = extractFilters(req.query);
    const data = await dashboardService.getStockChartData({ locationId });
    return success(res, data, 'Stock chart data retrieved');
  } catch (err) {
    return next(err);
  }
};

const getMovementTrends = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const data = await dashboardService.getMovementTrends(filters);
    return success(res, data, 'Movement trends retrieved');
  } catch (err) {
    return next(err);
  }
};

const exportStock = async (req, res, next) => {
  try {
    const { locationId, goodId } = extractFilters(req.query);
    const { stocks } = await dashboardService.getStockOverview({ locationId, goodId });

    const fields = [
      { label: 'Location', value: 'location.name' },
      { label: 'Location Code', value: 'location.code' },
      { label: 'Good', value: 'good.name' },
      { label: 'SKU', value: 'good.sku' },
      { label: 'Category', value: 'good.category' },
      { label: 'Unit', value: 'good.unit' },
      { label: 'Quantity', value: 'quantity' },
      { label: 'Min Quantity', value: 'minQuantity' },
      { label: 'Status', value: 'status' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(stocks);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stock-report.csv"');
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
};

const exportMovements = async (req, res, next) => {
  try {
    const filters = extractFilters(req.query);
    const { movements } = await dashboardService.getMovementReport(filters);

    const fields = [
      { label: 'Date', value: 'date' },
      { label: 'Type', value: 'type' },
      { label: 'Good', value: 'good.name' },
      { label: 'SKU', value: 'good.sku' },
      { label: 'Category', value: 'good.category' },
      { label: 'Unit', value: 'good.unit' },
      { label: 'Quantity', value: 'quantity' },
      { label: 'From Location', value: (row) => row.fromLocation?.name || '' },
      { label: 'To Location', value: (row) => row.toLocation?.name || '' },
      { label: 'Status', value: 'status' },
      { label: 'Notes', value: (row) => row.notes || '' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(movements);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="movement-report.csv"');
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const data = await dashboardService.getLocations();
    return success(res, data, 'Locations retrieved');
  } catch (err) {
    return next(err);
  }
};

const getGoods = async (req, res, next) => {
  try {
    const data = await dashboardService.getGoods();
    return success(res, data, 'Goods retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getStockOverview,
  getMovementReport,
  getMovementRequestSummary,
  getStockChartData,
  getMovementTrends,
  exportStock,
  exportMovements,
  getLocations,
  getGoods,
};
