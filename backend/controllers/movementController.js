const movementService = require('../services/movementService');
const { success, created } = require('../utils/response');

const preview = async (req, res, next) => {
  try {
    const { originLocationId, destinationLocationId, items } = req.body;
    const rows = await movementService.previewMovement(originLocationId, destinationLocationId, items);
    return success(res, rows, 'Preview calculated');
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await movementService.createMovement(req.user.id, req.body);
    return created(res, result, 'Movement request created');
  } catch (err) {
    return next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await movementService.listMovements({ status, page, limit });
    return success(res, result.movements, 'Movements retrieved', 200, result.meta);
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const movement = await movementService.getMovement(req.params.id);
    return success(res, movement, 'Movement retrieved');
  } catch (err) {
    return next(err);
  }
};

const approveHead = async (req, res, next) => {
  try {
    const movement = await movementService.approveByHead(req.user.id, req.params.id);
    return success(res, movement, 'Movement approved by warehouse head');
  } catch (err) {
    return next(err);
  }
};

const approveDest = async (req, res, next) => {
  try {
    // Pass the operator's locationId for destination ownership check
    const movement = await movementService.approveByDestination(
      req.user.id,
      req.params.id,
      req.user.locationId
    );
    return success(res, movement, 'Movement approved by destination');
  } catch (err) {
    return next(err);
  }
};

const finalize = async (req, res, next) => {
  try {
    const movement = await movementService.finalizeMovement(req.user.id, req.params.id);
    return success(res, movement, 'Movement finalized and stock updated');
  } catch (err) {
    return next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const movement = await movementService.rejectMovement(req.user.id, req.params.id, req.body.reason);
    return success(res, movement, 'Movement rejected');
  } catch (err) {
    return next(err);
  }
};

module.exports = { preview, create, list, getOne, approveHead, approveDest, finalize, reject };
