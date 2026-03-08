const { Op } = require('sequelize');
const { User, Location } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const auditLogService = require('./auditLogService');

const VALID_ROLES = ['admin', 'manager', 'viewer', 'warehouse_operator', 'warehouse_head', 'destination_operator'];

/**
 * List users with optional search and pagination.
 */
const list = async ({ search = '', page = 1, limit = 20, role } = {}) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  if (role) where.role = role;

  const offset = (page - 1) * limit;
  const { count, rows } = await User.findAndCountAll({
    where,
    include: [{ association: 'location', attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    users: rows,
    meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

/**
 * Get a single user by ID.
 */
const getById = async (id) => {
  const user = await User.findByPk(id, {
    include: [{ association: 'location', attributes: ['id', 'name'] }],
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * Create a new user.
 * @param {object} data - { name, email, password, role, phoneNumber, locationId, status }
 * @param {number} performedBy - ID of the user performing the action
 */
const create = async (data, performedBy) => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw new AppError('A user with that email already exists', 409);

  if (data.locationId) {
    const location = await Location.findByPk(data.locationId);
    if (!location) throw new AppError('Location not found', 404);
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'viewer',
    phoneNumber: data.phoneNumber || null,
    locationId: data.locationId || null,
    status: data.status || 'ACTIVE',
    isActive: data.status !== 'INACTIVE',
  });

  logger.audit('CREATE', 'User', { id: user.id, by: performedBy, data: { name: user.name, email: user.email, role: user.role } });

  await auditLogService.createAuditLog({
    userId: performedBy,
    action: 'CREATE',
    entity: 'User',
    entityId: user.id,
    before: null,
    after: { name: user.name, email: user.email, role: user.role, status: user.status },
  });

  return User.findByPk(user.id, {
    include: [{ association: 'location', attributes: ['id', 'name'] }],
  });
};

/**
 * Update an existing user.
 * @param {number} id - User ID
 * @param {object} data - Fields to update (password excluded here – use separate endpoint)
 * @param {number} performedBy - ID of the user performing the action
 */
const update = async (id, data, performedBy) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new AppError('A user with that email already exists', 409);
  }

  if (data.locationId) {
    const location = await Location.findByPk(data.locationId);
    if (!location) throw new AppError('Location not found', 404);
  }

  const before = {
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    locationId: user.locationId,
    status: user.status,
  };

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.locationId !== undefined) updateData.locationId = data.locationId;
  if (data.status !== undefined) {
    updateData.status = data.status;
    updateData.isActive = data.status === 'ACTIVE';
  }
  if (data.password !== undefined) updateData.password = data.password;

  await user.update(updateData);

  logger.audit('UPDATE', 'User', { id: user.id, by: performedBy, before, after: updateData });

  await auditLogService.createAuditLog({
    userId: performedBy,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    before,
    after: updateData,
  });

  return User.findByPk(id, {
    include: [{ association: 'location', attributes: ['id', 'name'] }],
  });
};

/**
 * Delete (hard delete) a user by ID.
 * @param {number} id
 * @param {number} performedBy - ID of the user performing the action
 */
const remove = async (id, performedBy) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);

  if (user.id === performedBy) throw new AppError('You cannot delete your own account', 403);

  const snapshot = { name: user.name, email: user.email, role: user.role };
  await user.destroy();

  logger.audit('DELETE', 'User', { id, by: performedBy, data: snapshot });

  await auditLogService.createAuditLog({
    userId: performedBy,
    action: 'DELETE',
    entity: 'User',
    entityId: id,
    before: snapshot,
    after: null,
  });
};

module.exports = { list, getById, create, update, remove };
