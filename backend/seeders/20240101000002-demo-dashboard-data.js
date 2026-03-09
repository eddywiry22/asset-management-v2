'use strict';

const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

module.exports = {
  async up(queryInterface) {
    // Locations
    await queryInterface.bulkInsert('locations', [
      { name: 'Main Warehouse', code: 'WH-MAIN', address: '123 Industrial Ave', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'North Depot', code: 'WH-NORTH', address: '456 North St', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'South Depot', code: 'WH-SOUTH', address: '789 South Blvd', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'East Hub', code: 'WH-EAST', address: '321 East Rd', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Goods
    await queryInterface.bulkInsert('goods', [
      { name: 'Steel Pipes', sku: 'PIPE-STL-001', unit: 'pcs', category: 'Raw Materials', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Aluminum Sheets', sku: 'ALUM-SHT-001', unit: 'kg', category: 'Raw Materials', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Industrial Bolts', sku: 'BOLT-IND-001', unit: 'box', category: 'Hardware', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Safety Helmets', sku: 'HELM-SAF-001', unit: 'pcs', category: 'Safety Equipment', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Electric Motors', sku: 'MOTR-ELC-001', unit: 'pcs', category: 'Electronics', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Copper Wire', sku: 'WIRE-COP-001', unit: 'm', category: 'Electronics', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Stocks (location_id x goods_id — use raw column names; stock table has no timestamps)
    const now = new Date();
    await queryInterface.bulkInsert('stocks', [
      // Main Warehouse
      { location_id: 1, goods_id: 1, quantity: 450, last_updated_at: now },
      { location_id: 1, goods_id: 2, quantity: 320, last_updated_at: now },
      { location_id: 1, goods_id: 3, quantity: 200, last_updated_at: now },
      { location_id: 1, goods_id: 4, quantity: 80,  last_updated_at: now },
      { location_id: 1, goods_id: 5, quantity: 15,  last_updated_at: now },
      { location_id: 1, goods_id: 6, quantity: 1200, last_updated_at: now },
      // North Depot
      { location_id: 2, goods_id: 1, quantity: 180, last_updated_at: now },
      { location_id: 2, goods_id: 2, quantity: 95,  last_updated_at: now },
      { location_id: 2, goods_id: 3, quantity: 500, last_updated_at: now },
      { location_id: 2, goods_id: 5, quantity: 8,   last_updated_at: now },
      // South Depot
      { location_id: 3, goods_id: 1, quantity: 220, last_updated_at: now },
      { location_id: 3, goods_id: 4, quantity: 45,  last_updated_at: now },
      { location_id: 3, goods_id: 6, quantity: 700, last_updated_at: now },
      // East Hub
      { location_id: 4, goods_id: 2, quantity: 130, last_updated_at: now },
      { location_id: 4, goods_id: 3, quantity: 350, last_updated_at: now },
      { location_id: 4, goods_id: 5, quantity: 12,  last_updated_at: now },
    ]);

    // Movement Requests
    await queryInterface.bulkInsert('movement_requests', [
      { fromLocationId: null, toLocationId: 1, status: 'PENDING', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: 1, toLocationId: 2, status: 'APPROVED', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: 3, toLocationId: null, status: 'REJECTED', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: null, toLocationId: 4, status: 'PENDING', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: 2, toLocationId: 3, status: 'APPROVED', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: 1, toLocationId: null, status: 'PENDING', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: null, toLocationId: 2, status: 'APPROVED', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
      { fromLocationId: 4, toLocationId: 1, status: 'REJECTED', requestedBy: 2, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('movement_requests', null, {});
    await queryInterface.bulkDelete('stocks', null, {});
    await queryInterface.bulkDelete('goods', null, {});
    await queryInterface.bulkDelete('locations', null, {});
  },
};
