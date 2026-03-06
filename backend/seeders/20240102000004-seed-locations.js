'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert('locations', [
      {
        name: 'Main Warehouse',
        address: '123 Industrial Park Road, Building A, Metro City, MC 10001',
        status: 'ACTIVE',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Secondary Warehouse',
        address: '456 Logistics Avenue, Unit 7, Metro City, MC 10002',
        status: 'ACTIVE',
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('locations', {
      name: ['Main Warehouse', 'Secondary Warehouse'],
    });
  },
};
