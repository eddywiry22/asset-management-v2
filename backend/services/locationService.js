const { Location } = require('../models');
const AppError = require('../utils/AppError');

const findAll = async ({ isActive } = {}) => {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  return Location.findAll({ where, order: [['name', 'ASC']] });
};

const findById = async (id) => {
  const location = await Location.findByPk(id);
  if (!location) throw new AppError('Location not found', 404);
  return location;
};

const create = async (data) => {
  const existing = await Location.findOne({ where: { code: data.code } });
  if (existing) throw new AppError('Location code already exists', 409);
  return Location.create(data);
};

const update = async (id, data) => {
  const location = await findById(id);
  if (data.code && data.code !== location.code) {
    const existing = await Location.findOne({ where: { code: data.code } });
    if (existing) throw new AppError('Location code already exists', 409);
  }
  await location.update(data);
  return location;
};

const remove = async (id) => {
  const location = await findById(id);
  await location.update({ isActive: false });
};

module.exports = { findAll, findById, create, update, remove };
