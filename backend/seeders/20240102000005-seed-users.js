'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    // Fetch role IDs
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('Warehouse Admin', 'Warehouse Head', 'Warehouse Operator')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    roles.forEach((r) => { roleMap[r.name] = r.id; });

    // Fetch location IDs
    const locations = await queryInterface.sequelize.query(
      `SELECT id, name FROM locations WHERE name IN ('Main Warehouse', 'Secondary Warehouse')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const locationMap = {};
    locations.forEach((l) => { locationMap[l.name] = l.id; });

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin Warehouse',
        phone_number: '+1-555-001-0001',
        email: 'warehouse.admin@example.com',
        password: await bcrypt.hash('Admin@1234', 12),
        role: 'admin',
        role_id: roleMap['Warehouse Admin'],
        location_id: locationMap['Main Warehouse'],
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Head Warehouse',
        phone_number: '+1-555-001-0002',
        email: 'warehouse.head@example.com',
        password: await bcrypt.hash('Head@1234', 12),
        role: 'manager',
        role_id: roleMap['Warehouse Head'],
        location_id: locationMap['Main Warehouse'],
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Operator One',
        phone_number: '+1-555-001-0003',
        email: 'operator.one@example.com',
        password: await bcrypt.hash('Operator@1234', 12),
        role: 'viewer',
        role_id: roleMap['Warehouse Operator'],
        location_id: locationMap['Main Warehouse'],
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Operator Two',
        phone_number: '+1-555-001-0004',
        email: 'operator.two@example.com',
        password: await bcrypt.hash('Operator@1234', 12),
        role: 'viewer',
        role_id: roleMap['Warehouse Operator'],
        location_id: locationMap['Secondary Warehouse'],
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: [
        'warehouse.admin@example.com',
        'warehouse.head@example.com',
        'operator.one@example.com',
        'operator.two@example.com',
      ],
    });
  },
};
