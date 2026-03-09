'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert('roles', [
      { name: 'admin', description: 'Full system access.' },
      { name: 'manager', description: 'Manager approval and reporting access.' },
      { name: 'viewer', description: 'Read-only dashboard/report access.' },
      { name: 'warehouse_head', description: 'Warehouse head operations and approvals.' },
      { name: 'warehouse_operator', description: 'Warehouse operator movement/stock operations.' },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: ['admin', 'manager', 'viewer', 'warehouse_head', 'warehouse_operator'],
    });
  },
};
