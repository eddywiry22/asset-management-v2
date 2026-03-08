const vendorService = require('../services/vendorService');
const { success, created } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const { search, page, limit, includeInactive } = req.query;
    const result = await vendorService.list({
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      includeInactive: includeInactive === 'true',
    });
    return success(res, result.vendors, 'Vendors retrieved', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const vendor = await vendorService.getById(req.params.id);
    return success(res, vendor, 'Vendor retrieved');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const vendor = await vendorService.create(req.body, req.user.id);
    return created(res, vendor, 'Vendor created');
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const vendor = await vendorService.update(req.params.id, req.body, req.user.id);
    return success(res, vendor, 'Vendor updated');
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await vendorService.remove(req.params.id, req.user.id);
    return success(res, null, 'Vendor deleted');
  } catch (err) {
    return next(err);
  }
};

const getImpact = async (req, res, next) => {
  try {
    const impact = await vendorService.getImpact(req.params.id);
    return success(res, impact, 'Vendor impact retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, getOne, getImpact, create, update, remove };
