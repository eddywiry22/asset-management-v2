'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);

    await queryInterface.bulkInsert('users', [
      {
        name: 'System Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Demo Manager',
        email: 'manager@example.com',
        password: await bcrypt.hash('Manager@1234', 12),
        role: 'manager',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@example.com', 'manager@example.com'],
    });
  },
};
