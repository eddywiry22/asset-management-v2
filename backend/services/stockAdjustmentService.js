const { Op } = require('sequelize');
const { StockAdjustment, Stock, Goods, Location, User, MovementHeader, MovementDetail, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const stockService = require('./stockService');
const { ACTIVE_MOVEMENT_STATUSES } = require('../utils/constants');

const INCLUDE_FULL = [
  {
    model: Stock,
    as: 'stock',
    include: [
      { model: Goods, as: 'goods', attributes: ['id', 'name', 'productId'] },
      { model: Location, as: 'location', attributes: ['id', 'name'] },
    ],
  },
  { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
];

const findAll = async ({ status, stock_id } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (stock_id) where.stock_id = stock_id;

  return StockAdjustment.findAll({
    where,
    include: INCLUDE_FULL,
    order: [['createdAt', 'DESC']],
  });
};

const findById = async (id) => {
  const adj = await StockAdjustment.findByPk(id, { include: INCLUDE_FULL });
  if (!adj) throw new AppError('Stock adjustment not found', 404);
  return adj;
};

/**
 * Request a manual stock adjustment (creates it with status 'pending').
 * goods_id + location_id are resolved to a stock record (created if absent).
 */
const requestAdjustment = async ({ goods_id, location_id, adjustment_type, quantity, reason }, requestedByUserId) => {
  // Only `add` and `subtract` are allowed — `set` was removed because it has no
  // computable signed delta and therefore cannot be included in period summaries.
  if (!['add', 'subtract'].includes(adjustment_type)) {
    throw new AppError(`Adjustment type "${adjustment_type}" is not allowed. Use "add" or "subtract".`, 422);
  }

  // Validate goods exists and is ACTIVE before proceeding (BUG-R7-03)
  const goods = await Goods.unscoped().findByPk(goods_id);
  if (!goods) throw new AppError('Goods not found', 404);
  if (goods.status !== 'ACTIVE') {
    throw new AppError(`Goods "${goods.name}" is inactive and cannot be adjusted`, 422);
  }

  // Validate location exists and is ACTIVE before proceeding (BUG-R10-02)
  const location = await Location.findByPk(location_id);
  if (!location) throw new AppError('Location not found', 404);
  if (location.status !== 'ACTIVE') {
    throw new AppError(`Location "${location.name}" is inactive and cannot be adjusted`, 422);
  }

  const stock = await stockService.findOrCreate(goods_id, location_id);

  // Block adjustment if this location is a participant in an active movement that
  // involves these goods (BUG-R7-05, BUG-R10-01).
  // The location filter is intentional: a movement between Location A and B must
  // not prevent Location C from adjusting its own independent stock of the same goods.
  const activeMovement = await MovementHeader.findOne({
    where: {
      status: { [Op.in]: ACTIVE_MOVEMENT_STATUSES },
      [Op.or]: [
        { originLocationId: location_id },
        { destinationLocationId: location_id },
      ],
    },
    include: [{
      model: MovementDetail,
      as: 'details',
      where: { goodsId: goods_id },
      required: true,
    }],
  });
  if (activeMovement) {
    throw new AppError(
      `Goods are currently part of active movement ${activeMovement.movementNumber}. Finalize or reject that movement before creating a stock adjustment.`,
      409
    );
  }

  // Pre-validate: ensure the proposed adjustment won't send quantity below zero
  // (full enforcement happens on approval, but give early feedback)
  if (adjustment_type === 'subtract') {
    const currentQty = parseFloat(stock.quantity);
    if (parseFloat(quantity) > currentQty) {
      throw new AppError(
        `Cannot subtract ${quantity} from current stock of ${currentQty}. Quantity cannot go below zero.`,
        422
      );
    }
  }

  return StockAdjustment.create({
    stock_id: stock.id,
    adjustment_type,
    quantity,
    reason,
    status: 'pending',
    requested_by: requestedByUserId,
  });
};

/**
 * Approve a pending adjustment. Applies the quantity change inside a transaction.
 */
const approveAdjustment = async (id, reviewedByUserId, review_note) => {
  return sequelize.transaction(async (t) => {
    const adj = await StockAdjustment.findByPk(id, {
      include: [{ model: Stock, as: 'stock' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!adj) throw new AppError('Stock adjustment not found', 404);
    if (adj.status !== 'pending') throw new AppError('Only pending adjustments can be approved', 422);

    const stock = adj.stock;
    const qty = parseFloat(adj.quantity);
    let newQuantity;

    switch (adj.adjustment_type) {
      case 'add':
        newQuantity = parseFloat(stock.quantity) + qty;
        break;
      case 'subtract':
        newQuantity = parseFloat(stock.quantity) - qty;
        break;
      default:
        // `set` and any other legacy types are rejected at approval time.
        throw new AppError(`Adjustment type "${adj.adjustment_type}" is no longer supported. Only "add" and "subtract" adjustments can be approved.`, 422);
    }

    if (newQuantity < 0) {
      throw new AppError(
        `Approval would result in negative stock (${newQuantity}). Quantity cannot go below zero.`,
        422
      );
    }

    await stock.update(
      { quantity: newQuantity, last_updated_at: new Date() },
      { transaction: t }
    );

    await adj.update(
      {
        status: 'approved',
        reviewed_by: reviewedByUserId,
        reviewed_at: new Date(),
        review_note: review_note || null,
      },
      { transaction: t }
    );

    return findById(id);
  });
};

/**
 * Reject a pending adjustment without changing stock quantity.
 */
const rejectAdjustment = async (id, reviewedByUserId, review_note) => {
  const adj = await findById(id);

  if (adj.status !== 'pending') throw new AppError('Only pending adjustments can be rejected', 422);

  await adj.update({
    status: 'rejected',
    reviewed_by: reviewedByUserId,
    reviewed_at: new Date(),
    review_note: review_note || null,
  });

  return findById(id);
};

module.exports = { findAll, findById, requestAdjustment, approveAdjustment, rejectAdjustment };
