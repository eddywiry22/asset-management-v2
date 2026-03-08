const { Op } = require('sequelize');
const { Location, LocationLog, MovementRequest, User } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const auditLogService = require('./auditLogService');

/** Statuses that indicate a movement request is not yet finalized */
const NON_FINALIZED_STATUSES = ['PENDING', 'APPROVED', 'IN_TRANSIT'];

/**
 * Return all locations, optionally filtered by status.
 * @param {{ status?: string }} query
 */
const getAll = async (query = {}) => {
  const where = {};
  if (query.status) {
    where.status = query.status.toUpperCase();
  }
  return Location.findAll({ where, order: [['name', 'ASC']] });
};

/**
 * Return a single location by ID.
 * @param {number} id
 */
const getById = async (id) => {
  const location = await Location.findByPk(id);
  if (!location) throw new AppError('Location not found', 404);
  return location;
};

/**
 * Create a new location and write an audit log entry.
 * @param {{ name: string, address: string, status?: string }} data
 * @param {number} performedBy - User ID of the actor
 */
const create = async (data, performedBy) => {
  const location = await Location.create({
    name: data.name,
    address: data.address,
    status: data.status ? data.status.toUpperCase() : 'ACTIVE',
  });

  await LocationLog.create({
    locationId: location.id,
    action: 'CREATED',
    changes: { name: location.name, address: location.address, status: location.status },
    performedBy,
  });

  logger.audit('CREATE', 'Location', { id: location.id, by: performedBy, data: { name: location.name } });

  await auditLogService.createAuditLog({
    userId: performedBy,
    action: 'CREATE',
    entity: 'Location',
    entityId: location.id,
    before: null,
    after: { name: location.name, address: location.address, status: location.status },
  });

  return location;
};

/**
 * Update a location and write an audit log entry.
 * Enforces the rule: cannot set status to INACTIVE when non-finalized
 * movement requests reference this location.
 * @param {number} id
 * @param {{ name?: string, address?: string, status?: string }} data
 * @param {number} performedBy - User ID of the actor
 */
const update = async (id, data, performedBy) => {
  const location = await Location.findByPk(id);
  if (!location) throw new AppError('Location not found', 404);

  const incomingStatus = data.status ? data.status.toUpperCase() : undefined;

  // Enforce INACTIVE restriction
  if (incomingStatus === 'INACTIVE' && location.status !== 'INACTIVE') {
    const blockingCount = await MovementRequest.count({
      where: {
        status: { [Op.in]: NON_FINALIZED_STATUSES },
        [Op.or]: [{ fromLocationId: id }, { toLocationId: id }],
      },
    });

    if (blockingCount > 0) {
      throw new AppError(
        `Cannot set location to INACTIVE: ${blockingCount} non-finalized movement request(s) involve this location.`,
        409
      );
    }
  }

  // Build changes diff
  const updatable = { name: data.name, address: data.address, status: incomingStatus };
  const changes = {};
  for (const [field, newVal] of Object.entries(updatable)) {
    if (newVal !== undefined && newVal !== location[field]) {
      changes[field] = { from: location[field], to: newVal };
    }
  }

  if (Object.keys(changes).length === 0) {
    return location; // Nothing changed
  }

  const before = { name: location.name, address: location.address, status: location.status };

  await location.update(Object.fromEntries(
    Object.entries(changes).map(([field, { to }]) => [field, to])
  ));

  await LocationLog.create({
    locationId: location.id,
    action: 'UPDATED',
    changes,
    performedBy,
  });

  logger.audit('UPDATE', 'Location', { id: location.id, by: performedBy, before, after: changes });

  await auditLogService.createAuditLog({
    userId: performedBy,
    action: 'UPDATE',
    entity: 'Location',
    entityId: id,
    before,
    after: changes,
  });

  return location.reload();
};

/**
 * Delete a location by ID.
 * Blocked if non-finalized movement requests reference this location,
 * or if any users are still assigned to this location.
 * @param {number} id
 * @param {number} performedBy - User ID of the actor
 */
const remove = async (id, performedBy) => {
  const location = await Location.findByPk(id);
  if (!location) throw new AppError('Location not found', 404);

  // Block deletion if non-finalized movement requests reference this location
  const blockingMovements = await MovementRequest.count({
    where: {
      status: { [Op.in]: NON_FINALIZED_STATUSES },
      [Op.or]: [{ fromLocationId: id }, { toLocationId: id }],
    },
  });

  if (blockingMovements > 0) {
    throw new AppError(
      `Cannot delete location: ${blockingMovements} non-finalized movement request(s) involve this location.`,
      409
    );
  }

  // Block deletion if users are still assigned to this location
  const assignedUsers = await User.count({ where: { locationId: id } });
  if (assignedUsers > 0) {
    throw new AppError(
      `Cannot delete location: ${assignedUsers} user(s) are assigned to this location. Reassign them first.`,
      409
    );
  }

  const snapshot = { name: location.name, address: location.address, status: location.status };
  await location.destroy();

  logger.audit('DELETE', 'Location', { id, by: performedBy, data: snapshot });

  await auditLogService.createAuditLog({
    userId: performedBy,
    action: 'DELETE',
    entity: 'Location',
    entityId: id,
    before: snapshot,
    after: null,
  });
};

/**
 * Return audit logs for a given location.
 * @param {number} id
 */
const getLogs = async (id) => {
  const location = await Location.findByPk(id);
  if (!location) throw new AppError('Location not found', 404);

  return LocationLog.findAll({
    where: { locationId: id },
    order: [['createdAt', 'DESC']],
    include: [{ association: 'performer', attributes: ['id', 'name', 'email'] }],
  });
};

module.exports = { getAll, getById, create, update, remove, getLogs };
