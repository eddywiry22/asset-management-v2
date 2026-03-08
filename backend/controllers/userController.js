const userService = require('../services/userService');
const { success, created } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const { search, page, limit, role } = req.query;
    const result = await userService.list({
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      role,
    });
    return success(res, result.users, 'Users retrieved', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const user = await userService.getById(Number(req.params.id));
    return success(res, user, 'User retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const user = await userService.create(req.body, req.user.id);
    return created(res, user, 'User created');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(Number(req.params.id), req.body, req.user.id);
    return success(res, user, 'User updated');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.remove(Number(req.params.id), req.user.id);
    return success(res, null, 'User deleted');
  } catch (err) {
    return next(err);
  }
};

const getImpact = async (req, res, next) => {
  try {
    const impact = await userService.getImpact(Number(req.params.id));
    return success(res, impact, 'User impact retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, getOne, getImpact, create, update, remove };
