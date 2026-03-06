'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        category: 'Electronics',
        description: 'Electronic equipment, devices, and components such as computers, monitors, and peripherals.',
      },
      {
        category: 'Office Supplies',
        description: 'General office supplies including stationery, paper, pens, and desk accessories.',
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('categories', {
      category: ['Electronics', 'Office Supplies'],
    });
  },
};
