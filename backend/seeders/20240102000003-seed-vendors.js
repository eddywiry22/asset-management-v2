'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('vendors', [
      {
        name: 'TechSupply Co.',
        contactPerson: 'Alice Tan',
        email: 'sales@techsupply.example',
        phone: '+1-555-020-1001',
        address: '100 Tech Park, Metro City',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'OfficeWorld Distributors',
        contactPerson: 'Brian Lee',
        email: 'orders@officeworld.example',
        phone: '+1-555-020-1002',
        address: '22 Commerce Road, Metro City',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('vendors', {
      name: ['TechSupply Co.', 'OfficeWorld Distributors'],
    });
  },
};
