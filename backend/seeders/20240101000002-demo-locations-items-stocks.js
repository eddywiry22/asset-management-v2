'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Locations ────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('locations', [
      { name: 'Warehouse A', code: 'WH-A', description: 'Main warehouse', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Warehouse B', code: 'WH-B', description: 'Secondary warehouse', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Warehouse C', code: 'WH-C', description: 'Overflow warehouse', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Store Front', code: 'SF-1', description: 'Retail store front', isActive: true, createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', null, {});
  },
};
