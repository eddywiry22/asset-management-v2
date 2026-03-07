const { Op, fn, col, literal } = require('sequelize');
const { Stock, Good, Location, Movement, MovementRequest, sequelize } = require('../models');

/**
 * Build a base WHERE clause from common filters.
 * @param {object} filters - { locationId, goodId, startDate, endDate }
 */
const buildDateWhere = ({ startDate, endDate }) => {
  const where = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }
  return where;
};

/**
 * Stock Overview – current stock levels with optional filters.
 */
const getStockOverview = async ({ locationId, goodId } = {}) => {
  const where = {};
  if (locationId) where.locationId = locationId;
  if (goodId) where.goodId = goodId;

  const stocks = await Stock.findAll({
    where,
    include: [
      { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
      { model: Good, as: 'good', attributes: ['id', 'name', 'sku', 'unit', 'category'] },
    ],
    order: [['locationId', 'ASC'], ['goodId', 'ASC']],
  });

  const totalItems = stocks.length;
  const totalQuantity = stocks.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
  const lowStockItems = stocks.filter((s) => parseFloat(s.quantity) <= parseFloat(s.minQuantity)).length;
  const outOfStockItems = stocks.filter((s) => parseFloat(s.quantity) === 0).length;

  return {
    summary: { totalItems, totalQuantity, lowStockItems, outOfStockItems },
    stocks: stocks.map((s) => ({
      id: s.id,
      location: s.location,
      good: s.good,
      quantity: parseFloat(s.quantity),
      minQuantity: parseFloat(s.minQuantity),
      status: parseFloat(s.quantity) === 0 ? 'out_of_stock' : parseFloat(s.quantity) <= parseFloat(s.minQuantity) ? 'low' : 'ok',
    })),
  };
};

/**
 * Movement Report – list of movements with optional filters.
 */
const getMovementReport = async ({ locationId, goodId, startDate, endDate } = {}) => {
  const where = buildDateWhere({ startDate, endDate });
  if (goodId) where.goodId = goodId;

  const locationWhere = {};

  const movements = await Movement.findAll({
    where,
    include: [
      { model: Location, as: 'fromLocation', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'toLocation', attributes: ['id', 'name', 'code'] },
      { model: Good, as: 'good', attributes: ['id', 'name', 'sku', 'unit', 'category'] },
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
  });

  // Filter by locationId if provided (either from or to)
  const filtered = locationId
    ? movements.filter(
        (m) =>
          (m.fromLocationId && m.fromLocationId == locationId) ||
          (m.toLocationId && m.toLocationId == locationId)
      )
    : movements;

  const totalIn = filtered.filter((m) => m.type === 'in').reduce((sum, m) => sum + parseFloat(m.quantity), 0);
  const totalOut = filtered.filter((m) => m.type === 'out').reduce((sum, m) => sum + parseFloat(m.quantity), 0);
  const totalTransfer = filtered.filter((m) => m.type === 'transfer').reduce((sum, m) => sum + parseFloat(m.quantity), 0);

  return {
    summary: {
      total: filtered.length,
      totalIn,
      totalOut,
      totalTransfer,
    },
    movements: filtered.map((m) => ({
      id: m.id,
      type: m.type,
      fromLocation: m.fromLocation,
      toLocation: m.toLocation,
      good: m.good,
      quantity: parseFloat(m.quantity),
      status: m.status,
      date: m.date,
      notes: m.notes,
    })),
  };
};

/**
 * Movement Request Summary – aggregated request counts by status.
 */
const getMovementRequestSummary = async ({ locationId, goodId, startDate, endDate } = {}) => {
  const where = buildDateWhere({ startDate, endDate });
  if (goodId) where.goodId = goodId;

  const requests = await MovementRequest.findAll({
    where,
    include: [
      { model: Location, as: 'fromLocation', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'toLocation', attributes: ['id', 'name', 'code'] },
      { model: Good, as: 'good', attributes: ['id', 'name', 'sku', 'unit', 'category'] },
    ],
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
  });

  const filtered = locationId
    ? requests.filter(
        (r) =>
          (r.fromLocationId && r.fromLocationId == locationId) ||
          (r.toLocationId && r.toLocationId == locationId)
      )
    : requests;

  const pending = filtered.filter((r) => r.status === 'pending').length;
  const approved = filtered.filter((r) => r.status === 'approved').length;
  const rejected = filtered.filter((r) => r.status === 'rejected').length;

  return {
    summary: {
      total: filtered.length,
      pending,
      approved,
      rejected,
    },
    requests: filtered.map((r) => ({
      id: r.id,
      type: r.type,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
      good: r.good,
      quantity: parseFloat(r.quantity),
      status: r.status,
      date: r.date,
      notes: r.notes,
    })),
  };
};

/**
 * Stock Chart Data – total quantity per good (bar chart).
 */
const getStockChartData = async ({ locationId } = {}) => {
  const where = {};
  if (locationId) where.locationId = locationId;

  const rows = await Stock.findAll({
    where,
    attributes: ['goodId', [fn('SUM', col('quantity')), 'totalQuantity']],
    include: [{ model: Good, as: 'good', attributes: ['name', 'unit'] }],
    group: ['goodId', 'good.id', 'good.name', 'good.unit'],
    order: [[literal('totalQuantity'), 'DESC']],
  });

  return rows.map((r) => ({
    name: r.good.name,
    unit: r.good.unit,
    quantity: parseFloat(r.getDataValue('totalQuantity')),
  }));
};

/**
 * Movement Trends – daily totals by type over a date range (line chart).
 */
const getMovementTrends = async ({ locationId, goodId, startDate, endDate } = {}) => {
  // Default to last 30 days if no range given
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  })();

  const where = { date: { [Op.between]: [start, end] } };
  if (goodId) where.goodId = goodId;

  const movements = await Movement.findAll({
    where,
    attributes: ['date', 'type', [fn('SUM', col('quantity')), 'total']],
    group: ['date', 'type'],
    order: [['date', 'ASC']],
    raw: true,
  });

  const filtered = locationId
    ? (await Movement.findAll({
        where: { ...where, [Op.or]: [{ fromLocationId: locationId }, { toLocationId: locationId }] },
        attributes: ['date', 'type', [fn('SUM', col('quantity')), 'total']],
        group: ['date', 'type'],
        order: [['date', 'ASC']],
        raw: true,
      }))
    : movements;

  // Build map of date -> { in, out, transfer }
  const dateMap = {};
  filtered.forEach(({ date, type, total }) => {
    const d = date instanceof Date ? date.toISOString().split('T')[0] : date;
    if (!dateMap[d]) dateMap[d] = { date: d, in: 0, out: 0, transfer: 0 };
    dateMap[d][type] = parseFloat(total);
  });

  // Fill in all dates in range
  const result = [];
  const cur = new Date(start);
  const endDate2 = new Date(end);
  while (cur <= endDate2) {
    const d = cur.toISOString().split('T')[0];
    result.push(dateMap[d] || { date: d, in: 0, out: 0, transfer: 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
};

/**
 * List all locations for filter dropdowns.
 */
const getLocations = async () => {
  return Location.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'code'],
    order: [['name', 'ASC']],
  });
};

/**
 * List all goods for filter dropdowns.
 */
const getGoods = async () => {
  return Good.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'sku', 'unit', 'category'],
    order: [['name', 'ASC']],
  });
};

module.exports = {
  getStockOverview,
  getMovementReport,
  getMovementRequestSummary,
  getStockChartData,
  getMovementTrends,
  getLocations,
  getGoods,
};
