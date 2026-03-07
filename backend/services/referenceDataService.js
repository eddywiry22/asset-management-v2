const { Location, Item, Stock } = require('../models');

const listLocations = async () => {
  return Location.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'code', 'description'],
    order: [['name', 'ASC']],
  });
};

const listItems = async () => {
  return Item.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'sku', 'unit'],
    order: [['name', 'ASC']],
  });
};

const listStocksByLocation = async (locationId) => {
  return Stock.findAll({
    where: { locationId },
    include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'unit'] }],
    order: [[{ model: Item, as: 'item' }, 'name', 'ASC']],
  });
};

module.exports = { listLocations, listItems, listStocksByLocation };
