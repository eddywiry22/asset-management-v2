const { Op, fn, col, literal } = require('sequelize');
const { Stock, Goods, Location, Movement, MovementRequest, sequelize } = require('../models');

/**
 * Build a base WHERE clause for date-range filtering on createdAt.
 * BUG-R8-04 fix: was using `where.date` which doesn't exist; the correct
 * column on timestamp-based models is `createdAt`.
 * @param {object} filters - { startDate, endDate }
 */
const buildDateWhere = ({ startDate, endDate }) => {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (endDate) where.createdAt[Op.lte] = endDate;
  }
  return where;
};

/**
 * Stock Overview – current stock levels with optional filters.
 * BUG-R8-03 fix: replaced non-existent `Good` model with `Goods`, fixed
 * association alias from `as: 'good'` to `as: 'goods'` (matches Stock.associate),
 * fixed `goodId` → `goodsId`, and removed non-existent `sku`/`unit` attributes.
 */
const getStockOverview = async ({ locationId, goodId } = {}) => {
  const where = {};
  if (locationId) where.locationId = locationId;
  if (goodId) where.goodsId = goodId;

  const stocks = await Stock.findAll({
    where,
    include: [
      { model: Location, as: 'location', attributes: ['id', 'name'], paranoid: false },
      { model: Goods, as: 'goods', attributes: ['id', 'name', 'productId', 'status'], paranoid: false },
    ],
    order: [['locationId', 'ASC'], ['goodsId', 'ASC']],
  });

  const totalItems = stocks.length;
  const totalQuantity = stocks.reduce((sum, s) => sum + parseFloat(s.quantity), 0);
  const outOfStockItems = stocks.filter((s) => parseFloat(s.quantity) === 0).length;

  return {
    summary: { totalItems, totalQuantity, outOfStockItems },
    stocks: stocks.map((s) => ({
      id: s.id,
      location: s.location,
      goods: s.goods,
      quantity: parseFloat(s.quantity),
      status: parseFloat(s.quantity) === 0 ? 'out_of_stock' : 'ok',
    })),
  };
};

/**
 * Movement Report – list of movements from the legacy Movement model.
 * BUG-R8-03 fix: removed invalid Good/Goods include (Movement has no goods FK;
 * it stores asset_name as a plain string). Only Location associations are valid.
 * Note: legacy Movement table stores locations as plain strings (from_location,
 * to_location), not FKs — the Location includes below will always return null.
 */
const getMovementReport = async ({ locationId, startDate, endDate } = {}) => {
  const where = buildDateWhere({ startDate, endDate });

  const movements = await Movement.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });

  const filtered = locationId
    ? movements.filter(
        (m) =>
          (m.fromLocationId && m.fromLocationId == locationId) ||
          (m.toLocationId && m.toLocationId == locationId)
      )
    : movements;

  return {
    summary: {
      total: filtered.length,
    },
    movements: filtered.map((m) => ({
      id: m.id,
      assetName: m.asset_name,
      fromLocation: m.from_location,
      toLocation: m.to_location,
      status: m.status,
      purpose: m.purpose,
    })),
  };
};

/**
 * Movement Request Summary – aggregated request counts by status.
 * BUG-R8-03 fix: removed invalid Good/Goods include (MovementRequest has no
 * goods FK). Kept Location includes which are valid via fromLocationId/toLocationId.
 * BUG-R8-04 fix: date filter now uses createdAt (via buildDateWhere).
 */
const getMovementRequestSummary = async ({ locationId, startDate, endDate } = {}) => {
  const where = buildDateWhere({ startDate, endDate });

  const requests = await MovementRequest.findAll({
    where,
    include: [
      { model: Location, as: 'fromLocation', attributes: ['id', 'name'] },
      { model: Location, as: 'toLocation', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  const filtered = locationId
    ? requests.filter(
        (r) =>
          (r.fromLocationId && r.fromLocationId == locationId) ||
          (r.toLocationId && r.toLocationId == locationId)
      )
    : requests;

  const pending = filtered.filter((r) => r.status === 'PENDING').length;
  const approved = filtered.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length;
  const rejected = filtered.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length;

  return {
    summary: {
      total: filtered.length,
      pending,
      approved,
      rejected,
    },
    requests: filtered.map((r) => ({
      id: r.id,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
      status: r.status,
    })),
  };
};

/**
 * Stock Chart Data – total quantity per goods item (bar chart).
 * BUG-R8-03 fix: replaced Good with Goods, fixed alias and goodsId field name.
 */
const getStockChartData = async ({ locationId } = {}) => {
  const where = {};
  if (locationId) where.locationId = locationId;

  const rows = await Stock.findAll({
    where,
    attributes: ['goodsId', [fn('SUM', col('quantity')), 'totalQuantity']],
    include: [{ model: Goods, as: 'goods', attributes: ['name'] }],
    group: ['goodsId', 'goods.id', 'goods.name'],
    order: [[literal('totalQuantity'), 'DESC']],
  });

  return rows.map((r) => ({
    name: r.goods.name,
    quantity: parseFloat(r.getDataValue('totalQuantity')),
  }));
};

/**
 * Movement Trends – daily totals over a date range (line chart).
 * Uses legacy Movement table. Returns empty data if table has no records.
 */
const getMovementTrends = async ({ locationId, startDate, endDate } = {}) => {
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  })();

  const where = { createdAt: { [Op.between]: [start, end] } };

  const baseQuery = {
    where,
    attributes: [
      [fn('DATE', col('createdAt')), 'date'],
      [fn('COUNT', col('id')), 'total'],
    ],
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
    raw: true,
  };

  const movements = locationId
    ? await Movement.findAll({ ...baseQuery, where: { ...where } })
    : await Movement.findAll(baseQuery);

  const dateMap = {};
  movements.forEach(({ date, total }) => {
    const d = typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0];
    dateMap[d] = { date: d, total: parseInt(total, 10) };
  });

  const result = [];
  const cur = new Date(start);
  const endDate2 = new Date(end);
  while (cur <= endDate2) {
    const d = cur.toISOString().split('T')[0];
    result.push(dateMap[d] || { date: d, total: 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
};

/**
 * List all active locations for filter dropdowns.
 * BUG-R8-03 fix: `isActive` is not a Location field; use `status: 'ACTIVE'`.
 */
const getLocations = async () => {
  return Location.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
  });
};

/**
 * List all active goods for filter dropdowns.
 * BUG-R8-03 fix: replaced non-existent Good model with Goods; removed non-existent
 * `sku`/`unit` attributes; dropped `where: { isActive: true }` (Goods.defaultScope
 * already filters to ACTIVE records).
 */
const getGoods = async () => {
  return Goods.findAll({
    attributes: ['id', 'name', 'productId'],
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
