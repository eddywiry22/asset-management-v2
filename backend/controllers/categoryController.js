const categoryService = require('../services/categoryService');
const { success, created } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const { search, page, limit, includeInactive } = req.query;
    const result = await categoryService.list({
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      includeInactive: includeInactive === 'true',
    });
    return success(res, result.categories, 'Categories retrieved', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const category = await categoryService.getById(req.params.id);
    return success(res, category, 'Category retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const category = await categoryService.create(req.body, req.user.id);
    return created(res, category, 'Category created');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.body, req.user.id);
    return success(res, category, 'Category updated');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await categoryService.remove(req.params.id, req.user.id);
    return success(res, null, 'Category deleted');
  } catch (err) {
    return next(err);
  }
};

const getImpact = async (req, res, next) => {
  try {
    const impact = await categoryService.getImpact(req.params.id);
    return success(res, impact, 'Category impact retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, getOne, getImpact, create, update, remove };
