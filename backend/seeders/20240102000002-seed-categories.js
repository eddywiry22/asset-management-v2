'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Electronics',
        description: 'Electronic equipment and components.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Office Supplies',
        description: 'General office consumables and stationery.',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('categories', {
      name: ['Electronics', 'Office Supplies'],
    });
  },
};
