const { Goods, AuditLog } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Write an audit log entry for a Goods operation.
 * @param {object} actor - req.user (id, email)
 * @param {'CREATE'|'UPDATE'|'DELETE'} action
 * @param {number|null} entityId
 * @param {object|null} before - snapshot before change
 * @param {object|null} after  - snapshot after change
 */
const writeAuditLog = async (actor, action, entityId, before = null, after = null) => {
  await AuditLog.create({
    userId: actor?.id ?? null,
    userEmail: actor?.email ?? null,
    action,
    entity: 'Goods',
    entityId,
    before,
    after,
  });
};

/**
 * Return all goods records with optional filters.
 * @param {{ status?: string, category?: string }} filters
 */
const listGoods = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;

  return Goods.findAll({ where, order: [['createdAt', 'DESC']] });
};

/**
 * Return a single goods record by primary key.
 * @param {number} id
 */
const getGoodsById = async (id) => {
  const goods = await Goods.findByPk(id);
  if (!goods) throw new AppError('Goods not found', 404);
  return goods;
};

/**
 * Create a new goods record and log the action.
 * @param {object} data - validated fields
 * @param {object} actor - req.user
 */
const createGoods = async (data, actor) => {
  const existing = await Goods.findOne({ where: { product_id: data.product_id } });
  if (existing) {
    throw new AppError(`product_id "${data.product_id}" is already in use`, 409);
  }

  const goods = await Goods.create(data);
  await writeAuditLog(actor, 'CREATE', goods.id, null, goods.toJSON());
  return goods;
};

/**
 * Update an existing goods record and log the change.
 * @param {number} id
 * @param {object} data - validated fields
 * @param {object} actor - req.user
 */
const updateGoods = async (id, data, actor) => {
  const goods = await getGoodsById(id);

  // If product_id is being changed, ensure uniqueness
  if (data.product_id && data.product_id !== goods.product_id) {
    const existing = await Goods.findOne({ where: { product_id: data.product_id } });
    if (existing) {
      throw new AppError(`product_id "${data.product_id}" is already in use`, 409);
    }
  }

  const before = goods.toJSON();
  await goods.update(data);
  await writeAuditLog(actor, 'UPDATE', goods.id, before, goods.toJSON());
  return goods;
};

/**
 * Delete a goods record and log the action.
 * @param {number} id
 * @param {object} actor - req.user
 */
const deleteGoods = async (id, actor) => {
  const goods = await getGoodsById(id);
  const before = goods.toJSON();
  await goods.destroy();
  await writeAuditLog(actor, 'DELETE', id, before, null);
};

/**
 * Return only ACTIVE goods — used by movement request module.
 */
const listActiveGoods = async () => {
  return Goods.findAll({ where: { status: 'ACTIVE' }, order: [['name', 'ASC']] });
};

module.exports = { listGoods, getGoodsById, createGoods, updateGoods, deleteGoods, listActiveGoods };
