'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert('vendors', [
      {
        vendor: 'TechSupply Co.',
        description: 'Primary supplier for electronic equipment, computing hardware, and IT accessories.',
      },
      {
        vendor: 'OfficeWorld Distributors',
        description: 'Wholesale distributor for office furniture, supplies, and consumables.',
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('vendors', {
      vendor: ['TechSupply Co.', 'OfficeWorld Distributors'],
    });
  },
};
