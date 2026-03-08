const { Op } = require('sequelize');
const { Category, Goods } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const auditLogService = require('./auditLogService');

/**
 * List categories with optional search and pagination.
 */
const list = async ({ search = '', page = 1, limit = 20, includeInactive = false } = {}) => {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (search) where.name = { [Op.like]: `%${search}%` };

  const offset = (page - 1) * limit;
  const { count, rows } = await Category.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    categories: rows,
    meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

/**
 * Get a single category by ID.
 */
const getById = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError('Category not found', 404);
  return category;
};

/**
 * Create a new category.
 * @param {object} data - { name, description }
 * @param {number} userId - ID of the user performing the action
 */
const create = async (data, userId) => {
  const existing = await Category.findOne({ where: { name: data.name } });
  if (existing) throw new AppError('A category with that name already exists', 409);

  const category = await Category.create(data);

  logger.audit('CREATE', 'Category', { id: category.id, by: userId, data: { name: category.name } });

  await auditLogService.createAuditLog({
    userId,
    action: 'CREATE',
    entity: 'Category',
    entityId: category.id,
    before: null,
    after: { name: category.name, description: category.description, isActive: category.isActive },
  });

  return category;
};

/**
 * Update an existing category.
 * Warns if deactivating a category that is referenced by active Goods.
 * @param {number} id - Category ID
 * @param {object} data - Fields to update
 * @param {number} userId - ID of the user performing the action
 */
const update = async (id, data, userId) => {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError('Category not found', 404);

  if (data.name && data.name !== category.name) {
    const existing = await Category.findOne({ where: { name: data.name } });
    if (existing) throw new AppError('A category with that name already exists', 409);
  }

  // Warn if deactivating a category still used by active Goods
  if (data.isActive === false && category.isActive !== false) {
    const goodsCount = await Goods.unscoped().count({ where: { category: id, status: 'ACTIVE' } });
    if (goodsCount > 0) {
      throw new AppError(
        `Cannot deactivate category: ${goodsCount} active good(s) still reference this category.`,
        409
      );
    }
  }

  const before = { name: category.name, description: category.description, isActive: category.isActive };
  await category.update(data);

  logger.audit('UPDATE', 'Category', { id: category.id, by: userId, before, after: data });

  await auditLogService.createAuditLog({
    userId,
    action: 'UPDATE',
    entity: 'Category',
    entityId: id,
    before,
    after: data,
  });

  return category;
};

/**
 * Return impact summary for a category before soft-delete.
 * @param {number} id
 */
const getImpact = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError('Category not found', 404);

  const goodsCount = await Goods.unscoped().count({ where: { category: id } });
  return { goodsCount };
};

/**
 * Soft-delete a category by ID.
 * Goods retain their category FK (soft-delete preserves integrity).
 * @param {number} id
 * @param {number} userId - ID of the user performing the action
 */
const remove = async (id, userId) => {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError('Category not found', 404);

  const snapshot = { name: category.name, description: category.description, isActive: category.isActive };
  await category.destroy();

  logger.audit('DELETE', 'Category', { id, by: userId, data: snapshot });

  await auditLogService.createAuditLog({
    userId,
    action: 'DELETE',
    entity: 'Category',
    entityId: id,
    before: snapshot,
    after: null,
  });
};

module.exports = { list, getById, getImpact, create, update, remove };
