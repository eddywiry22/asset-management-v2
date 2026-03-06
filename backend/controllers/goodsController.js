const goodsService = require('../services/goodsService');
const { success, created } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const data = await goodsService.findAll(filter);
    return success(res, data, 'Goods retrieved');
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await goodsService.findById(req.params.id);
    return success(res, data, 'Goods retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await goodsService.create(req.body);
    return created(res, data, 'Goods created');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await goodsService.update(req.params.id, req.body);
    return success(res, data, 'Goods updated');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await goodsService.remove(req.params.id);
    return success(res, null, 'Goods deactivated');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
