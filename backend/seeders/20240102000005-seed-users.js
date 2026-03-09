'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('admin', 'warehouse_head', 'warehouse_operator')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

    const locations = await queryInterface.sequelize.query(
      `SELECT id, name FROM locations WHERE name IN ('Main Warehouse', 'Secondary Warehouse')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const locationMap = Object.fromEntries(locations.map((l) => [l.name, l.id]));

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin Warehouse',
        phone_number: '+1-555-001-0001',
        email: 'warehouse.admin@example.com',
        password: await bcrypt.hash('Admin@1234', 12),
        role: 'admin',
        role_id: roleMap.admin || null,
        location_id: locationMap['Main Warehouse'] || null,
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Head Warehouse (Main)',
        phone_number: '+1-555-001-0002',
        email: 'warehouse.head.main@example.com',
        password: await bcrypt.hash('Head@1234', 12),
        role: 'warehouse_head',
        role_id: roleMap.warehouse_head || null,
        location_id: locationMap['Main Warehouse'] || null,
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Head Warehouse (Secondary)',
        phone_number: '+1-555-001-0005',
        email: 'warehouse.head.secondary@example.com',
        password: await bcrypt.hash('Head@1234', 12),
        role: 'warehouse_head',
        role_id: roleMap.warehouse_head || null,
        location_id: locationMap['Secondary Warehouse'] || null,
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
        role: 'warehouse_operator',
        role_id: roleMap.warehouse_operator || null,
        location_id: locationMap['Main Warehouse'] || null,
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
        role: 'warehouse_operator',
        role_id: roleMap.warehouse_operator || null,
        location_id: locationMap['Secondary Warehouse'] || null,
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
        'warehouse.head.main@example.com',
        'warehouse.head.secondary@example.com',
        'operator.one@example.com',
        'operator.two@example.com',
      ],
    });
  },
};
