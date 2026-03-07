const goodsService = require('../services/goodsService');
const { success, created } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const goods = await goodsService.listGoods(req.query);
    return success(res, goods, 'Goods retrieved');
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const goods = await goodsService.getGoodsById(req.params.id);
    return success(res, goods, 'Goods retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const goods = await goodsService.createGoods(req.body, req.user);
    return created(res, goods, 'Goods created successfully');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const goods = await goodsService.updateGoods(req.params.id, req.body, req.user);
    return success(res, goods, 'Goods updated successfully');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await goodsService.deleteGoods(req.params.id, req.user);
    return success(res, null, 'Goods deleted successfully');
  } catch (err) {
    return next(err);
  }
};

const listActive = async (req, res, next) => {
  try {
    const goods = await goodsService.listActiveGoods();
    return success(res, goods, 'Active goods retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, getById, create, update, remove, listActive };
