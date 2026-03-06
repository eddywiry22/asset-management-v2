const { StockAdjustment, Stock, Goods, Location, User, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const stockService = require('./stockService');

const INCLUDE_FULL = [
  {
    model: Stock,
    as: 'stock',
    include: [
      { model: Goods, as: 'goods', attributes: ['id', 'name', 'sku', 'unit'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
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
  const stock = await stockService.findOrCreate(goods_id, location_id);

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
      case 'set':
        newQuantity = qty;
        break;
      default:
        throw new AppError('Unknown adjustment type', 500);
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
