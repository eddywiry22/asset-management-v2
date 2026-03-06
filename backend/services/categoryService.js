const { Op } = require('sequelize');
const { Category } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

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

  return category;
};

/**
 * Update an existing category.
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

  const before = { name: category.name, description: category.description, isActive: category.isActive };
  await category.update(data);

  logger.audit('UPDATE', 'Category', { id: category.id, by: userId, before, after: data });

  return category;
};

/**
 * Delete (hard delete) a category by ID.
 * @param {number} id
 * @param {number} userId - ID of the user performing the action
 */
const remove = async (id, userId) => {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError('Category not found', 404);

  const snapshot = { name: category.name };
  await category.destroy();

  logger.audit('DELETE', 'Category', { id, by: userId, data: snapshot });
};

module.exports = { list, getById, create, update, remove };
