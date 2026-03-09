'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('locations', [
      { name: 'Warehouse A', address: 'Main warehouse', status: 'ACTIVE', created_by: null, created_at: now, updated_at: now },
      { name: 'Warehouse B', address: 'Secondary warehouse', status: 'ACTIVE', created_by: null, created_at: now, updated_at: now },
      { name: 'Warehouse C', address: 'Overflow warehouse', status: 'ACTIVE', created_by: null, created_at: now, updated_at: now },
      { name: 'Store Front', address: 'Retail store front', status: 'ACTIVE', created_by: null, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', {
      name: ['Warehouse A', 'Warehouse B', 'Warehouse C', 'Store Front'],
    });
  },
};
