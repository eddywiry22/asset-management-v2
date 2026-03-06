const locationService = require('../services/locationService');
const { success, created } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const data = await locationService.findAll(filter);
    return success(res, data, 'Locations retrieved');
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await locationService.findById(req.params.id);
    return success(res, data, 'Location retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await locationService.create(req.body);
    return created(res, data, 'Location created');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await locationService.update(req.params.id, req.body);
    return success(res, data, 'Location updated');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await locationService.remove(req.params.id);
    return success(res, null, 'Location deactivated');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
