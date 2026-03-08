const { Op } = require('sequelize');
const { Vendor, Goods } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const auditLogService = require('./auditLogService');

/**
 * List vendors with optional search and pagination.
 */
const list = async ({ search = '', page = 1, limit = 20, includeInactive = false } = {}) => {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { contactPerson: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await Vendor.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    vendors: rows,
    meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

/**
 * Get a single vendor by ID.
 */
const getById = async (id) => {
  const vendor = await Vendor.findByPk(id);
  if (!vendor) throw new AppError('Vendor not found', 404);
  return vendor;
};

/**
 * Create a new vendor.
 * @param {object} data - { name, contactPerson, email, phone, address }
 * @param {number} userId - ID of the user performing the action
 */
const create = async (data, userId) => {
  const existing = await Vendor.findOne({ where: { name: data.name } });
  if (existing) throw new AppError('A vendor with that name already exists', 409);

  const vendor = await Vendor.create(data);

  logger.audit('CREATE', 'Vendor', { id: vendor.id, by: userId, data: { name: vendor.name } });

  await auditLogService.createAuditLog({
    userId,
    action: 'CREATE',
    entity: 'Vendor',
    entityId: vendor.id,
    before: null,
    after: { name: vendor.name, contactPerson: vendor.contactPerson, email: vendor.email, isActive: vendor.isActive },
  });

  return vendor;
};

/**
 * Update an existing vendor.
 * Warns if deactivating a vendor that is referenced by active Goods.
 * @param {number} id - Vendor ID
 * @param {object} data - Fields to update
 * @param {number} userId - ID of the user performing the action
 */
const update = async (id, data, userId) => {
  const vendor = await Vendor.findByPk(id);
  if (!vendor) throw new AppError('Vendor not found', 404);

  if (data.name && data.name !== vendor.name) {
    const existing = await Vendor.findOne({ where: { name: data.name } });
    if (existing) throw new AppError('A vendor with that name already exists', 409);
  }

  // Warn if deactivating a vendor still used by active Goods
  if (data.isActive === false && vendor.isActive !== false) {
    const goodsCount = await Goods.unscoped().count({ where: { vendor: id, status: 'ACTIVE' } });
    if (goodsCount > 0) {
      throw new AppError(
        `Cannot deactivate vendor: ${goodsCount} active good(s) still reference this vendor.`,
        409
      );
    }
  }

  const before = {
    name: vendor.name,
    contactPerson: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    isActive: vendor.isActive,
  };
  await vendor.update(data);

  logger.audit('UPDATE', 'Vendor', { id: vendor.id, by: userId, before, after: data });

  await auditLogService.createAuditLog({
    userId,
    action: 'UPDATE',
    entity: 'Vendor',
    entityId: id,
    before,
    after: data,
  });

  return vendor;
};

/**
 * Return impact summary for a vendor before soft-delete.
 * @param {number} id
 */
const getImpact = async (id) => {
  const vendor = await Vendor.findByPk(id);
  if (!vendor) throw new AppError('Vendor not found', 404);

  const goodsCount = await Goods.unscoped().count({ where: { vendor: id } });
  return { goodsCount };
};

/**
 * Soft-delete a vendor by ID.
 * Goods retain their vendor FK (soft-delete preserves integrity).
 * @param {number} id
 * @param {number} userId - ID of the user performing the action
 */
const remove = async (id, userId) => {
  const vendor = await Vendor.findByPk(id);
  if (!vendor) throw new AppError('Vendor not found', 404);

  const snapshot = {
    name: vendor.name,
    contactPerson: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    isActive: vendor.isActive,
  };
  await vendor.destroy();

  logger.audit('DELETE', 'Vendor', { id, by: userId, data: snapshot });

  await auditLogService.createAuditLog({
    userId,
    action: 'DELETE',
    entity: 'Vendor',
    entityId: id,
    before: snapshot,
    after: null,
  });
};

module.exports = { list, getById, getImpact, create, update, remove };
