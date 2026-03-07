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

    const [locations] = await queryInterface.sequelize.query(
      "SELECT id, code FROM locations WHERE code IN ('WH-A','WH-B','WH-C','SF-1')"
    );
    const locMap = Object.fromEntries(locations.map((l) => [l.code, l.id]));

    // ── Items ─────────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('items', [
      { name: 'Widget A', sku: 'ITM-001', unit: 'pcs', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Widget B', sku: 'ITM-002', unit: 'pcs', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Gadget X', sku: 'ITM-003', unit: 'pcs', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Supply Pack', sku: 'ITM-004', unit: 'box', isActive: true, createdAt: now, updatedAt: now },
    ]);

    const [items] = await queryInterface.sequelize.query(
      "SELECT id, sku FROM items WHERE sku IN ('ITM-001','ITM-002','ITM-003','ITM-004')"
    );
    const itemMap = Object.fromEntries(items.map((i) => [i.sku, i.id]));

    // ── Stocks ────────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('stocks', [
      // Warehouse A – fully stocked
      { locationId: locMap['WH-A'], itemId: itemMap['ITM-001'], quantity: 100, createdAt: now, updatedAt: now },
      { locationId: locMap['WH-A'], itemId: itemMap['ITM-002'], quantity: 50,  createdAt: now, updatedAt: now },
      { locationId: locMap['WH-A'], itemId: itemMap['ITM-003'], quantity: 200, createdAt: now, updatedAt: now },
      { locationId: locMap['WH-A'], itemId: itemMap['ITM-004'], quantity: 30,  createdAt: now, updatedAt: now },
      // Warehouse B – partial
      { locationId: locMap['WH-B'], itemId: itemMap['ITM-001'], quantity: 25,  createdAt: now, updatedAt: now },
      { locationId: locMap['WH-B'], itemId: itemMap['ITM-003'], quantity: 10,  createdAt: now, updatedAt: now },
      // Warehouse C – empty (no stock rows – good for testing auto-create)
      // Store Front – small stock
      { locationId: locMap['SF-1'], itemId: itemMap['ITM-001'], quantity: 5,   createdAt: now, updatedAt: now },
      { locationId: locMap['SF-1'], itemId: itemMap['ITM-002'], quantity: 8,   createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stocks', null, {});
    await queryInterface.bulkDelete('items', null, {});
    await queryInterface.bulkDelete('locations', null, {});
  },
};
