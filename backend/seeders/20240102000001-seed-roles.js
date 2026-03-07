'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'Warehouse Admin',
        description: 'Full access to all warehouse modules including user management and system configuration.',
      },
      {
        name: 'Warehouse Head',
        description: 'Oversees warehouse operations, can approve transactions and manage stock.',
      },
      {
        name: 'Warehouse Operator',
        description: 'Day-to-day warehouse operations including receiving, dispatching, and stock updates.',
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: ['Warehouse Admin', 'Warehouse Head', 'Warehouse Operator'],
    });
  },
};
