const { Location, Goods, Stock } = require('../models');

const listLocations = async () => {
  return Location.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['id', 'name', 'address', 'status'],
    order: [['name', 'ASC']],
  });
};

const listGoods = async () => {
  return Goods.findAll({
    attributes: ['id', 'name', 'productId', 'status'],
    order: [['name', 'ASC']],
  });
};

const listStocksByLocation = async (locationId) => {
  return Stock.findAll({
    where: { locationId },
    include: [{ model: Goods, as: 'goods', attributes: ['id', 'name', 'productId', 'status'] }],
    order: [[{ model: Goods, as: 'goods' }, 'name', 'ASC']],
  });
};

module.exports = { listLocations, listGoods, listStocksByLocation };
