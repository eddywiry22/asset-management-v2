const { Goods } = require('../models');
const AppError = require('../utils/AppError');

const findAll = async ({ isActive } = {}) => {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  return Goods.findAll({ where, order: [['name', 'ASC']] });
};

const findById = async (id) => {
  const goods = await Goods.findByPk(id);
  if (!goods) throw new AppError('Goods not found', 404);
  return goods;
};

const create = async (data) => {
  const existing = await Goods.findOne({ where: { sku: data.sku } });
  if (existing) throw new AppError('SKU already exists', 409);
  return Goods.create(data);
};

const update = async (id, data) => {
  const goods = await findById(id);
  if (data.sku && data.sku !== goods.sku) {
    const existing = await Goods.findOne({ where: { sku: data.sku } });
    if (existing) throw new AppError('SKU already exists', 409);
  }
  await goods.update(data);
  return goods;
};

const remove = async (id) => {
  const goods = await findById(id);
  await goods.update({ isActive: false });
};

module.exports = { findAll, findById, create, update, remove };
