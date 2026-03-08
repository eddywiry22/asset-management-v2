const { Op } = require('sequelize');
const { sequelize, MovementHeader, MovementDetail, Location, Goods, Stock, User } = require('../models');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('./auditLogService');
const { ACTIVE_MOVEMENT_STATUSES: ACTIVE_STATUSES } = require('../utils/constants');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateMovementNumber = async () => {
  const count = await MovementHeader.count();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `MV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
};

/**
 * Fetch the current stock quantity for a goods item at a location.
 * Uses goodsId (references Goods table) — the single source of truth.
 */
const fetchStockQty = async (locationId, goodsId, transaction = null) => {
  const opts = { where: { locationId, goodsId } };
  if (transaction) opts.transaction = transaction;
  const stock = await Stock.findOne(opts);
  return stock ? parseFloat(stock.quantity) : null;
};

const withFullIncludes = () => [
  { model: Location, as: 'originLocation', attributes: ['id', 'name', 'status'], paranoid: false },
  { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'status'], paranoid: false },
  { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'], paranoid: false },
  { model: User, as: 'headApprovedBy', attributes: ['id', 'name', 'email'], paranoid: false },
  { model: User, as: 'destApprovedBy', attributes: ['id', 'name', 'email'], paranoid: false },
  { model: User, as: 'finalizedBy', attributes: ['id', 'name', 'email'], paranoid: false },
  { model: User, as: 'rejectedBy', attributes: ['id', 'name', 'email'], paranoid: false },
  {
    model: MovementDetail,
    as: 'details',
    include: [{ model: Goods, as: 'goods', attributes: ['id', 'name', 'productId', 'status'], paranoid: false }],
  },
];

// ---------------------------------------------------------------------------
// Duplicate check
// ---------------------------------------------------------------------------

/**
 * Check for an active duplicate movement with the same origin, destination,
 * and set of goods — quantity-agnostic per the architecture spec
 * ("same items" means same goods, regardless of quantity).
 *
 * BUG-03 fix: this function must be called inside a transaction (passed as
 * `transaction`) so that the SELECT is part of the same atomic operation as
 * the INSERT, preventing TOCTOU races under concurrent requests.
 *
 * BUG-11 fix: removed quantity from the comparison — two requests for the
 * same goods between the same locations are duplicates even at different qty.
 *
 * BUG-12 fix: the query runs inside the caller's transaction, and the DB-level
 * index on (origin_location_id, destination_location_id, status) (added in
 * migration 20260307000002) ensures fast, consistent lookups under load.
 */
const findDuplicateActiveMovement = async (originLocationId, destinationLocationId, items, transaction = null) => {
  const findOpts = {
    where: {
      originLocationId,
      destinationLocationId,
      status: { [Op.in]: ACTIVE_STATUSES },
    },
    include: [{ model: MovementDetail, as: 'details' }],
  };
  if (transaction) findOpts.transaction = transaction;

  const activeMovements = await MovementHeader.findAll(findOpts);

  // Sort incoming goods IDs for O(n) comparison
  const sortedGoodsIds = [...items]
    .map((i) => Number(i.goodsId))
    .sort((a, b) => a - b);

  for (const movement of activeMovements) {
    const movGoodsIds = [...movement.details]
      .map((d) => Number(d.goodsId))
      .sort((a, b) => a - b);

    if (movGoodsIds.length !== sortedGoodsIds.length) continue;

    const isMatch = sortedGoodsIds.every((goodsId, idx) => movGoodsIds[idx] === goodsId);
    if (isMatch) return movement;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Preview (no DB write) – shows qty before/after for a proposed movement
// ---------------------------------------------------------------------------

const previewMovement = async (originLocationId, destinationLocationId, items) => {
  const rows = [];
  for (const { goodsId, quantity } of items) {
    // BUG-R3-05: Sequelize v6 findByPk does NOT apply defaultScope, so an
    // INACTIVE goods record would be found and returned. Use unscoped() to
    // bypass the defaultScope entirely, then perform an explicit status check
    // below so that the correct 404 vs 400 error is returned in each case.
    // BUG-R3-01: Without this explicit check, inactive goods can be previewed
    // without error, violating the business rule that INACTIVE goods must not
    // be selectable in movement requests.
    const goods = await Goods.unscoped().findByPk(goodsId, { attributes: ['id', 'name', 'productId', 'status'] });
    if (!goods) throw new AppError(`Goods with ID ${goodsId} not found`, 404);
    if (goods.status !== 'ACTIVE') {
      throw new AppError(`Goods "${goods.name}" is inactive and cannot be used in a movement`, 400);
    }

    const originQtyBefore = await fetchStockQty(originLocationId, goodsId);
    const destQtyBefore = await fetchStockQty(destinationLocationId, goodsId);
    const qty = parseFloat(quantity);

    rows.push({
      goodsId: goods.id,
      goodsName: goods.name,
      goodsProductId: goods.productId,
      quantity: qty,
      originQtyBefore,
      originQtyAfter: originQtyBefore !== null ? originQtyBefore - qty : null,
      destinationQtyBefore: destQtyBefore !== null ? destQtyBefore : 0,
      destinationQtyAfter: (destQtyBefore !== null ? destQtyBefore : 0) + qty,
      noOriginStock: originQtyBefore === null,
      noDestStock: destQtyBefore === null,
    });
  }
  return rows;
};

// ---------------------------------------------------------------------------
// Create movement request
// ---------------------------------------------------------------------------

const createMovement = async (requestedById, data) => {
  const { originLocationId, destinationLocationId, notes, items } = data;

  if (originLocationId === destinationLocationId) {
    throw new AppError('Origin and destination locations cannot be the same', 400);
  }

  const [originLocation, destLocation] = await Promise.all([
    Location.findByPk(originLocationId),
    Location.findByPk(destinationLocationId),
  ]);
  if (!originLocation) throw new AppError('Origin location not found', 404);
  if (!destLocation) throw new AppError('Destination location not found', 404);

  // Guard: locations must be ACTIVE to be used in movements
  if (originLocation.status !== 'ACTIVE') {
    throw new AppError(`Origin location "${originLocation.name}" is inactive and cannot be used in a movement`, 400);
  }
  if (destLocation.status !== 'ACTIVE') {
    throw new AppError(`Destination location "${destLocation.name}" is inactive and cannot be used in a movement`, 400);
  }

  if (!items || items.length === 0) {
    throw new AppError('At least one item is required', 400);
  }

  const warnings = [];
  const detailData = [];

  for (const { goodsId, quantity } of items) {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      throw new AppError(`Quantity must be greater than 0`, 400);
    }

    // Use Goods as the single source of truth; check ACTIVE status
    const goods = await Goods.findByPk(goodsId);
    if (!goods) throw new AppError(`Goods with ID ${goodsId} not found`, 404);
    if (goods.status !== 'ACTIVE') throw new AppError(`Goods "${goods.name}" is inactive and cannot be moved`, 400);

    const originQtyBefore = await fetchStockQty(originLocationId, goodsId);
    if (originQtyBefore === null) {
      throw new AppError(
        `No stock record exists for goods "${goods.name}" at the origin location`,
        400
      );
    }

    const originQtyAfter = originQtyBefore - qty;
    if (originQtyAfter < 0) {
      throw new AppError(
        `Insufficient stock for goods "${goods.name}". Available: ${originQtyBefore}, Requested: ${qty}`,
        400
      );
    }

    let destQtyBefore = await fetchStockQty(destinationLocationId, goodsId);
    if (destQtyBefore === null) {
      warnings.push(
        `Stock record for goods "${goods.name}" does not exist at the destination location. It will be created automatically.`
      );
      destQtyBefore = 0;
    }

    detailData.push({
      goodsId: Number(goodsId),
      quantity: qty,
      originQtyBefore,
      originQtyAfter,
      destinationQtyBefore: destQtyBefore,
      destinationQtyAfter: destQtyBefore + qty,
    });
  }

  // Determine which destination stocks need auto-creation
  const itemsNeedingDestStock = [];
  for (const d of detailData) {
    const exists = await Stock.findOne({ where: { locationId: destinationLocationId, goodsId: d.goodsId } });
    if (!exists) itemsNeedingDestStock.push(d.goodsId);
  }

  const movement = await sequelize.transaction(async (t) => {
    // BUG-03 fix: duplicate check runs inside the transaction so the SELECT
    // and INSERT are atomic — concurrent identical requests cannot both pass.
    const duplicate = await findDuplicateActiveMovement(originLocationId, destinationLocationId, items, t);
    if (duplicate) {
      throw new AppError(
        `A duplicate active movement request already exists (${duplicate.movementNumber})`,
        409
      );
    }

    const movementNumber = await generateMovementNumber();

    const header = await MovementHeader.create(
      {
        movementNumber,
        originLocationId,
        destinationLocationId,
        requestedById,
        status: 'PENDING_HEAD_APPROVAL',
        notes: notes || null,
      },
      { transaction: t }
    );

    // Auto-create missing destination stocks at qty 0
    for (const goodsId of itemsNeedingDestStock) {
      await Stock.create(
        { locationId: destinationLocationId, goodsId, quantity: 0, lastUpdatedAt: new Date() },
        { transaction: t }
      );
    }

    await MovementDetail.bulkCreate(
      detailData.map(({ goodsId, quantity, originQtyBefore, originQtyAfter, destinationQtyBefore, destinationQtyAfter }) => ({
        movementHeaderId: header.id,
        goodsId,
        quantity,
        originQtyBefore,
        originQtyAfter,
        destinationQtyBefore,
        destinationQtyAfter,
      })),
      { transaction: t }
    );

    return header;
  });

  // Audit log: movement created
  await createAuditLog({
    userId: requestedById,
    action: 'CREATE',
    entity: 'MovementHeader',
    entityId: movement.id,
    after: { movementNumber: movement.movementNumber, status: movement.status, originLocationId, destinationLocationId },
  });

  const fullMovement = await getMovement(movement.id);
  return { movement: fullMovement, warnings };
};

// ---------------------------------------------------------------------------
// Get a single movement with all associations
// ---------------------------------------------------------------------------

const getMovement = async (id) => {
  const movement = await MovementHeader.findByPk(id, { include: withFullIncludes() });
  if (!movement) throw new AppError('Movement not found', 404);
  return movement;
};

// ---------------------------------------------------------------------------
// List movements with optional filters
// ---------------------------------------------------------------------------

const listMovements = async ({ status, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (status) where.status = status;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows } = await MovementHeader.findAndCountAll({
    where,
    include: [
      { model: Location, as: 'originLocation', attributes: ['id', 'name'], paranoid: false },
      { model: Location, as: 'destinationLocation', attributes: ['id', 'name'], paranoid: false },
      { model: User, as: 'requestedBy', attributes: ['id', 'name'], paranoid: false },
      { model: MovementDetail, as: 'details', attributes: ['id', 'goodsId'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
    distinct: true,
  });

  return {
    movements: rows,
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(count / parseInt(limit, 10)),
    },
  };
};

// ---------------------------------------------------------------------------
// Workflow transitions
// ---------------------------------------------------------------------------

const approveByHead = async (userId, movementId) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (movement.status !== 'PENDING_HEAD_APPROVAL') {
    throw new AppError(`Cannot approve: movement is currently "${movement.status}"`, 400);
  }

  // BUG-04: prevent self-approval — the warehouse head cannot approve a
  // movement they themselves created.
  if (movement.requestedById === userId) {
    throw new AppError('You cannot approve a movement request that you created', 403);
  }

  const before = { status: movement.status };

  await movement.update({
    status: 'PENDING_DESTINATION_APPROVAL',
    headApprovedById: userId,
    headApprovedAt: new Date(),
  });

  await createAuditLog({
    userId,
    action: 'APPROVE_HEAD',
    entity: 'MovementHeader',
    entityId: movement.id,
    before,
    after: { status: 'PENDING_DESTINATION_APPROVAL' },
  });

  return getMovement(movementId);
};

const approveByDestination = async (userId, movementId, userLocationId, userRole) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (movement.status !== 'PENDING_DESTINATION_APPROVAL') {
    throw new AppError(`Cannot approve: movement is currently "${movement.status}"`, 400);
  }

  // BUG-R3-02: admin and manager do not have a locationId assigned, so the
  // ownership check always failed for them — making their route permission
  // effectively dead. Privileged roles are explicitly exempted from the
  // location-ownership requirement; all other roles (destination_operator)
  // must still belong to the destination location.
  //
  // BUG-05: Destination location ownership check — the approver must belong to
  // the destination location. A null/missing locationId must NOT bypass this
  // guard for non-privileged users; it is treated as a mismatch (fail-closed).
  const isPrivilegedRole = userRole === 'admin' || userRole === 'manager';
  if (!isPrivilegedRole && (!userLocationId || userLocationId !== movement.destinationLocationId)) {
    throw new AppError(
      'You can only approve movements where you are the destination location operator',
      403
    );
  }

  const before = { status: movement.status };

  await movement.update({
    status: 'APPROVED_READY_FOR_FINALIZATION',
    destApprovedById: userId,
    destApprovedAt: new Date(),
  });

  await createAuditLog({
    userId,
    action: 'APPROVE_DEST',
    entity: 'MovementHeader',
    entityId: movement.id,
    before,
    after: { status: 'APPROVED_READY_FOR_FINALIZATION' },
  });

  return getMovement(movementId);
};

const finalizeMovement = async (userId, movementId, userRole) => {
  const movement = await MovementHeader.findByPk(movementId, {
    include: [{ model: MovementDetail, as: 'details' }],
  });
  if (!movement) throw new AppError('Movement not found', 404);
  if (movement.status !== 'APPROVED_READY_FOR_FINALIZATION') {
    throw new AppError(`Cannot finalize: movement is currently "${movement.status}"`, 400);
  }

  // BUG-R3-03: Without an ownership check, any warehouse_operator could finalize
  // any approved movement — not just their own. Restrict warehouse_operator to
  // movements they originally created. admin and manager may finalize any movement.
  const isPrivilegedRole = userRole === 'admin' || userRole === 'manager';
  if (!isPrivilegedRole && movement.requestedById !== userId) {
    throw new AppError('You can only finalize movements that you created', 403);
  }

  const before = { status: movement.status };

  await sequelize.transaction(async (t) => {
    for (const detail of movement.details) {
      // Deduct from origin (row lock) — uses goodsId
      const originStock = await Stock.findOne({
        where: { locationId: movement.originLocationId, goodsId: detail.goodsId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!originStock) throw new AppError('Origin stock record no longer exists', 500);

      const newOriginQty = parseFloat(originStock.quantity) - parseFloat(detail.quantity);
      if (newOriginQty < 0) {
        throw new AppError(
          'Insufficient stock at origin location at time of finalization',
          400
        );
      }
      await originStock.update({ quantity: newOriginQty, lastUpdatedAt: new Date() }, { transaction: t });

      // Add to destination (row lock) — uses goodsId
      let destStock = await Stock.findOne({
        where: { locationId: movement.destinationLocationId, goodsId: detail.goodsId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!destStock) {
        destStock = await Stock.create(
          { locationId: movement.destinationLocationId, goodsId: detail.goodsId, quantity: 0, lastUpdatedAt: new Date() },
          { transaction: t }
        );
      }
      await destStock.update(
        { quantity: parseFloat(destStock.quantity) + parseFloat(detail.quantity), lastUpdatedAt: new Date() },
        { transaction: t }
      );
    }

    await movement.update(
      { status: 'COMPLETED', finalizedById: userId, finalizedAt: new Date() },
      { transaction: t }
    );
  });

  await createAuditLog({
    userId,
    action: 'FINALIZE',
    entity: 'MovementHeader',
    entityId: movement.id,
    before,
    after: { status: 'COMPLETED' },
  });

  return getMovement(movementId);
};

const rejectMovement = async (userId, movementId, reason, userRole) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (['COMPLETED', 'REJECTED'].includes(movement.status)) {
    throw new AppError(`Cannot reject: movement is already "${movement.status}"`, 400);
  }

  // BUG-09: Stage-specific rejection guard.
  // Rejection is only valid at specific workflow stages for specific roles:
  //   warehouse_head       — may reject at PENDING_HEAD_APPROVAL only
  //   destination_operator — may reject at PENDING_DESTINATION_APPROVAL only
  //   admin / manager      — may reject at either of the above two stages
  // Post-destination-approval (APPROVED_READY_FOR_FINALIZATION) rejection is
  // not permitted through this route — the movement has already been fully
  // approved and awaits physical execution.
  if (movement.status === 'APPROVED_READY_FOR_FINALIZATION') {
    throw new AppError(
      'Cannot reject: movement has already been approved for finalization. Cancel it instead.',
      400
    );
  }

  if (userRole === 'warehouse_head' && movement.status !== 'PENDING_HEAD_APPROVAL') {
    throw new AppError(
      'Warehouse head can only reject movements pending head approval',
      403
    );
  }

  if (userRole === 'destination_operator' && movement.status !== 'PENDING_DESTINATION_APPROVAL') {
    throw new AppError(
      'Destination operator can only reject movements pending destination approval',
      403
    );
  }

  const before = { status: movement.status };

  await movement.update({
    status: 'REJECTED',
    rejectionReason: reason,
    rejectedById: userId,
    rejectedAt: new Date(),
  });

  await createAuditLog({
    userId,
    action: 'REJECT',
    entity: 'MovementHeader',
    entityId: movement.id,
    before,
    after: { status: 'REJECTED', rejectionReason: reason },
  });

  return getMovement(movementId);
};

/**
 * Cancel a movement — allows the originating warehouse_operator to withdraw
 * their own PENDING_HEAD_APPROVAL request before it has been reviewed.
 *
 * BUG-08: warehouse_operator previously had no way to cancel their own pending
 * request, making it impossible to correct mistakes without admin intervention.
 */
const cancelMovement = async (userId, movementId) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);

  // Only the requester may cancel their own request
  if (movement.requestedById !== userId) {
    throw new AppError('You can only cancel movements that you created', 403);
  }

  // Cancellation is only valid while the request is still pending initial approval
  if (movement.status !== 'PENDING_HEAD_APPROVAL') {
    throw new AppError(
      `Cannot cancel: movement is currently "${movement.status}". Only PENDING_HEAD_APPROVAL requests can be cancelled.`,
      400
    );
  }

  const before = { status: movement.status };

  await movement.update({
    status: 'REJECTED',
    rejectionReason: 'Cancelled by requester',
    rejectedById: userId,
    rejectedAt: new Date(),
  });

  await createAuditLog({
    userId,
    action: 'CANCEL',
    entity: 'MovementHeader',
    entityId: movement.id,
    before,
    after: { status: 'REJECTED', rejectionReason: 'Cancelled by requester' },
  });

  return getMovement(movementId);
};

module.exports = {
  previewMovement,
  createMovement,
  getMovement,
  listMovements,
  approveByHead,
  approveByDestination,
  finalizeMovement,
  rejectMovement,
  cancelMovement,
};
