const stockService = require('../services/stockService');
const { success } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { goods_id, location_id } = req.query;
    const data = await stockService.findAll({ goods_id, location_id });
    return success(res, data, 'Stock records retrieved');
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await stockService.findById(req.params.id);
    return success(res, data, 'Stock record retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById };
