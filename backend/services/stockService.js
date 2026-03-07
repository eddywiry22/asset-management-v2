const { Stock, Goods, Location } = require('../models');
const AppError = require('../utils/AppError');

const findAll = async ({ goods_id, location_id } = {}) => {
  const where = {};
  if (goods_id) where.goods_id = goods_id;
  if (location_id) where.location_id = location_id;

  return Stock.findAll({
    where,
    include: [
      { model: Goods, as: 'goods', attributes: ['id', 'name', 'sku', 'unit'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
    ],
    order: [
      [{ model: Goods, as: 'goods' }, 'name', 'ASC'],
      [{ model: Location, as: 'location' }, 'name', 'ASC'],
    ],
  });
};

const findById = async (id) => {
  const stock = await Stock.findByPk(id, {
    include: [
      { model: Goods, as: 'goods', attributes: ['id', 'name', 'sku', 'unit'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'code'] },
    ],
  });
  if (!stock) throw new AppError('Stock record not found', 404);
  return stock;
};

/**
 * Find or create a stock record for the given goods/location pair.
 */
const findOrCreate = async (goods_id, location_id) => {
  const [stock] = await Stock.findOrCreate({
    where: { goods_id, location_id },
    defaults: { quantity: 0, last_updated_at: new Date() },
  });
  return stock;
};

module.exports = { findAll, findById, findOrCreate };
