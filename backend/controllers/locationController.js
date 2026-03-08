const locationService = require('../services/locationService');
const { success, created } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const locations = await locationService.getAll(req.query);
    return success(res, locations, 'Locations retrieved');
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const location = await locationService.getById(Number(req.params.id));
    return success(res, location, 'Location retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const location = await locationService.create(req.body, req.user.id);
    return created(res, location, 'Location created');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const location = await locationService.update(Number(req.params.id), req.body, req.user.id);
    return success(res, location, 'Location updated');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await locationService.remove(Number(req.params.id), req.user.id);
    return success(res, null, 'Location deleted');
  } catch (err) {
    return next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const logs = await locationService.getLogs(Number(req.params.id));
    return success(res, logs, 'Location logs retrieved');
  } catch (err) {
    return next(err);
  }
};

const getImpact = async (req, res, next) => {
  try {
    const impact = await locationService.getImpact(Number(req.params.id));
    return success(res, impact, 'Location impact retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, getImpact, create, update, remove, getLogs };
