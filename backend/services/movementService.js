const { Op } = require('sequelize');
const { sequelize, MovementHeader, MovementDetail, Location, Item, Stock, User } = require('../models');
const AppError = require('../utils/AppError');

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

const fetchStockQty = async (locationId, itemId, transaction = null) => {
  const opts = { where: { locationId, itemId } };
  if (transaction) opts.transaction = transaction;
  const stock = await Stock.findOne(opts);
  return stock ? parseFloat(stock.quantity) : null;
};

const withFullIncludes = () => [
  { model: Location, as: 'originLocation', attributes: ['id', 'name', 'code'] },
  { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'code'] },
  { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'headApprovedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'destApprovedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'finalizedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'rejectedBy', attributes: ['id', 'name', 'email'] },
  {
    model: MovementDetail,
    as: 'details',
    include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'sku', 'unit'] }],
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
    .map((i) => ({ itemId: Number(i.itemId), quantity: parseFloat(i.quantity) }))
    .sort((a, b) => a.itemId - b.itemId);

  for (const movement of activeMovements) {
    const movDetails = [...movement.details]
      .map((d) => ({ itemId: Number(d.itemId), quantity: parseFloat(d.quantity) }))
      .sort((a, b) => a.itemId - b.itemId);

    if (movDetails.length !== sortedItems.length) continue;

    const isMatch = sortedItems.every((item, idx) => {
      const detail = movDetails[idx];
      return detail.itemId === item.itemId && detail.quantity === item.quantity;
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
  for (const { itemId, quantity } of items) {
    const item = await Item.findByPk(itemId, { attributes: ['id', 'name', 'sku', 'unit'] });
    if (!item) throw new AppError(`Item with ID ${itemId} not found`, 404);

    const originQtyBefore = await fetchStockQty(originLocationId, itemId);
    const destQtyBefore = await fetchStockQty(destinationLocationId, itemId);
    const qty = parseFloat(quantity);

    rows.push({
      itemId: item.id,
      itemName: item.name,
      itemSku: item.sku,
      itemUnit: item.unit,
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

  for (const { itemId, quantity } of items) {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      throw new AppError(`Quantity must be greater than 0`, 400);
    }

    const item = await Item.findByPk(itemId);
    if (!item) throw new AppError(`Item with ID ${itemId} not found`, 404);
    if (!item.isActive) throw new AppError(`Item "${item.name}" is inactive`, 400);

    const originQtyBefore = await fetchStockQty(originLocationId, itemId);
    if (originQtyBefore === null) {
      throw new AppError(
        `No stock record exists for item "${item.name}" at the origin location`,
        400
      );
    }

    const originQtyAfter = originQtyBefore - qty;
    if (originQtyAfter < 0) {
      throw new AppError(
        `Insufficient stock for item "${item.name}". Available: ${originQtyBefore}, Requested: ${qty}`,
        400
      );
    }

    let destQtyBefore = await fetchStockQty(destinationLocationId, itemId);
    if (destQtyBefore === null) {
      warnings.push(
        `Stock record for item "${item.name}" does not exist at the destination location. It will be created automatically.`
      );
      destQtyBefore = 0;
    }

    detailData.push({
      itemId: Number(itemId),
      quantity: qty,
      originQtyBefore,
      originQtyAfter,
      destinationQtyBefore: destQtyBefore,
      destinationQtyAfter: destQtyBefore + qty,
      autoCreateDestStock: destQtyBefore === 0 && (await fetchStockQty(destinationLocationId, itemId)) === null,
    });
  }

  // Re-check which destination stocks need auto-creation (the loop above may have set 0 for existing stocks too)
  // Re-derive by checking DB directly in the transaction
  const itemsNeedingDestStock = [];
  for (const d of detailData) {
    const exists = await Stock.findOne({ where: { locationId: destinationLocationId, itemId: d.itemId } });
    if (!exists) itemsNeedingDestStock.push(d.itemId);
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
    for (const itemId of itemsNeedingDestStock) {
      await Stock.create(
        { locationId: destinationLocationId, itemId, quantity: 0 },
        { transaction: t }
      );
    }

    await MovementDetail.bulkCreate(
      detailData.map(({ itemId, quantity, originQtyBefore, originQtyAfter, destinationQtyBefore, destinationQtyAfter }) => ({
        movementHeaderId: header.id,
        itemId,
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
      { model: Location, as: 'originLocation', attributes: ['id', 'name', 'code'] },
      { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'code'] },
      { model: User, as: 'requestedBy', attributes: ['id', 'name'] },
      { model: MovementDetail, as: 'details', attributes: ['id', 'itemId'] },
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

  await movement.update({
    status: 'PENDING_DESTINATION_APPROVAL',
    headApprovedById: userId,
    headApprovedAt: new Date(),
  });

  return getMovement(movementId);
};

const approveByDestination = async (userId, movementId) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (movement.status !== 'PENDING_DESTINATION_APPROVAL') {
    throw new AppError(`Cannot approve: movement is currently "${movement.status}"`, 400);
  }

  await movement.update({
    status: 'APPROVED_READY_FOR_FINALIZATION',
    destApprovedById: userId,
    destApprovedAt: new Date(),
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

  await sequelize.transaction(async (t) => {
    for (const detail of movement.details) {
      // Deduct from origin (row lock)
      const originStock = await Stock.findOne({
        where: { locationId: movement.originLocationId, itemId: detail.itemId },
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
      await originStock.update({ quantity: newOriginQty }, { transaction: t });

      // Add to destination (row lock)
      let destStock = await Stock.findOne({
        where: { locationId: movement.destinationLocationId, itemId: detail.itemId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!destStock) {
        destStock = await Stock.create(
          { locationId: movement.destinationLocationId, itemId: detail.itemId, quantity: 0 },
          { transaction: t }
        );
      }
      await destStock.update(
        { quantity: parseFloat(destStock.quantity) + parseFloat(detail.quantity) },
        { transaction: t }
      );
    }

    await movement.update(
      { status: 'COMPLETED', finalizedById: userId, finalizedAt: new Date() },
      { transaction: t }
    );
  });

  return getMovement(movementId);
};

const rejectMovement = async (userId, movementId, reason) => {
  const movement = await MovementHeader.findByPk(movementId);
  if (!movement) throw new AppError('Movement not found', 404);
  if (['COMPLETED', 'REJECTED'].includes(movement.status)) {
    throw new AppError(`Cannot reject: movement is already "${movement.status}"`, 400);
  }

  await movement.update({
    status: 'REJECTED',
    rejectionReason: reason || null,
    rejectedById: userId,
    rejectedAt: new Date(),
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
