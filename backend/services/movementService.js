const { Op } = require('sequelize');
const { sequelize, MovementHeader, MovementDetail, Location, Goods, Stock, User } = require('../models');
const AppError = require('../utils/AppError');
const { createAuditLog } = require('./auditLogService');

const ACTIVE_STATUSES = [
  'PENDING_HEAD_APPROVAL',
  'PENDING_DESTINATION_APPROVAL',
  'APPROVED_READY_FOR_FINALIZATION',
];

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
  { model: Location, as: 'originLocation', attributes: ['id', 'name', 'status'] },
  { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'status'] },
  { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'headApprovedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'destApprovedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'finalizedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'rejectedBy', attributes: ['id', 'name', 'email'] },
  {
    model: MovementDetail,
    as: 'details',
    include: [{ model: Goods, as: 'goods', attributes: ['id', 'name', 'productId', 'status'] }],
  },
];

// ---------------------------------------------------------------------------
// Duplicate check
// ---------------------------------------------------------------------------

const findDuplicateActiveMovement = async (originLocationId, destinationLocationId, items) => {
  const activeMovements = await MovementHeader.findAll({
    where: {
      originLocationId,
      destinationLocationId,
      status: { [Op.in]: ACTIVE_STATUSES },
    },
    include: [{ model: MovementDetail, as: 'details' }],
  });

  const sortedItems = [...items]
    .map((i) => ({ goodsId: Number(i.goodsId), quantity: parseFloat(i.quantity) }))
    .sort((a, b) => a.goodsId - b.goodsId);

  for (const movement of activeMovements) {
    const movDetails = [...movement.details]
      .map((d) => ({ goodsId: Number(d.goodsId), quantity: parseFloat(d.quantity) }))
      .sort((a, b) => a.goodsId - b.goodsId);

    if (movDetails.length !== sortedItems.length) continue;

    const isMatch = sortedItems.every((item, idx) => {
      const detail = movDetails[idx];
      return detail.goodsId === item.goodsId && detail.quantity === item.quantity;
    });

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
    const goods = await Goods.findByPk(goodsId, { attributes: ['id', 'name', 'productId', 'status'] });
    if (!goods) throw new AppError(`Goods with ID ${goodsId} not found`, 404);

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

  const duplicate = await findDuplicateActiveMovement(originLocationId, destinationLocationId, items);
  if (duplicate) {
    throw new AppError(
      `A duplicate active movement request already exists (${duplicate.movementNumber})`,
      409
    );
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
      { model: Location, as: 'originLocation', attributes: ['id', 'name'] },
      { model: Location, as: 'destinationLocation', attributes: ['id', 'name'] },
      { model: User, as: 'requestedBy', attributes: ['id', 'name'] },
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

const approveByDestination = async (userId, movementId, userLocationId) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (movement.status !== 'PENDING_DESTINATION_APPROVAL') {
    throw new AppError(`Cannot approve: movement is currently "${movement.status}"`, 400);
  }

  // Destination location ownership check: approver must belong to the destination location
  if (userLocationId && userLocationId !== movement.destinationLocationId) {
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

const finalizeMovement = async (userId, movementId) => {
  const movement = await MovementHeader.findByPk(movementId, {
    include: [{ model: MovementDetail, as: 'details' }],
  });
  if (!movement) throw new AppError('Movement not found', 404);
  if (movement.status !== 'APPROVED_READY_FOR_FINALIZATION') {
    throw new AppError(`Cannot finalize: movement is currently "${movement.status}"`, 400);
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

const rejectMovement = async (userId, movementId, reason) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (['COMPLETED', 'REJECTED'].includes(movement.status)) {
    throw new AppError(`Cannot reject: movement is already "${movement.status}"`, 400);
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

module.exports = {
  previewMovement,
  createMovement,
  getMovement,
  listMovements,
  approveByHead,
  approveByDestination,
  finalizeMovement,
  rejectMovement,
};
