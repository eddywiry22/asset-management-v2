const stockAdjustmentService = require('../services/stockAdjustmentService');
const { success, created } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { status, stock_id } = req.query;
    const data = await stockAdjustmentService.findAll({ status, stock_id });
    return success(res, data, 'Stock adjustments retrieved');
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await stockAdjustmentService.findById(req.params.id);
    return success(res, data, 'Stock adjustment retrieved');
  } catch (err) {
    return next(err);
  }
};

const requestAdjustment = async (req, res, next) => {
  try {
    const data = await stockAdjustmentService.requestAdjustment(req.body, req.user.id);
    return created(res, data, 'Stock adjustment request submitted and awaiting approval');
  } catch (err) {
    return next(err);
  }
};

const approveAdjustment = async (req, res, next) => {
  try {
    const { review_note } = req.body;
    const data = await stockAdjustmentService.approveAdjustment(req.params.id, req.user.id, review_note);
    return success(res, data, 'Stock adjustment approved and stock updated');
  } catch (err) {
    return next(err);
  }
};

const rejectAdjustment = async (req, res, next) => {
  try {
    const { review_note } = req.body;
    const data = await stockAdjustmentService.rejectAdjustment(req.params.id, req.user.id, review_note);
    return success(res, data, 'Stock adjustment rejected');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAll, getById, requestAdjustment, approveAdjustment, rejectAdjustment };
