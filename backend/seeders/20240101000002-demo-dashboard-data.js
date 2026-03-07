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

    // Stocks (locationId x goodId)
    await queryInterface.bulkInsert('stocks', [
      // Main Warehouse
      { locationId: 1, goodId: 1, quantity: 450, minQuantity: 100, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 1, goodId: 2, quantity: 320, minQuantity: 50, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 1, goodId: 3, quantity: 200, minQuantity: 30, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 1, goodId: 4, quantity: 80, minQuantity: 20, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 1, goodId: 5, quantity: 15, minQuantity: 5, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 1, goodId: 6, quantity: 1200, minQuantity: 200, createdAt: new Date(), updatedAt: new Date() },
      // North Depot
      { locationId: 2, goodId: 1, quantity: 180, minQuantity: 50, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 2, goodId: 2, quantity: 95, minQuantity: 20, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 2, goodId: 3, quantity: 500, minQuantity: 100, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 2, goodId: 5, quantity: 8, minQuantity: 3, createdAt: new Date(), updatedAt: new Date() },
      // South Depot
      { locationId: 3, goodId: 1, quantity: 220, minQuantity: 50, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 3, goodId: 4, quantity: 45, minQuantity: 10, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 3, goodId: 6, quantity: 700, minQuantity: 150, createdAt: new Date(), updatedAt: new Date() },
      // East Hub
      { locationId: 4, goodId: 2, quantity: 130, minQuantity: 30, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 4, goodId: 3, quantity: 350, minQuantity: 80, createdAt: new Date(), updatedAt: new Date() },
      { locationId: 4, goodId: 5, quantity: 12, minQuantity: 5, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Movements (30 days of data)
    await queryInterface.bulkInsert('movements', [
      { type: 'in', fromLocationId: null, toLocationId: 1, goodId: 1, quantity: 100, status: 'completed', date: daysAgo(29), notes: 'Purchase order #1001', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 1, goodId: 2, quantity: 80, status: 'completed', date: daysAgo(28), notes: 'Purchase order #1002', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 1, toLocationId: null, goodId: 3, quantity: 50, status: 'completed', date: daysAgo(27), notes: 'Sales order #2001', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 1, toLocationId: 2, goodId: 1, quantity: 30, status: 'completed', date: daysAgo(26), notes: 'Restock North Depot', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 2, goodId: 5, quantity: 5, status: 'completed', date: daysAgo(25), notes: 'Purchase order #1003', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 2, toLocationId: null, goodId: 3, quantity: 20, status: 'completed', date: daysAgo(24), notes: 'Sales order #2002', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 3, goodId: 6, quantity: 300, status: 'completed', date: daysAgo(23), notes: 'Purchase order #1004', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 1, toLocationId: 3, goodId: 4, quantity: 15, status: 'completed', date: daysAgo(22), notes: 'Restock South Depot', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 1, toLocationId: null, goodId: 6, quantity: 100, status: 'completed', date: daysAgo(21), notes: 'Sales order #2003', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 4, goodId: 2, quantity: 60, status: 'completed', date: daysAgo(20), notes: 'Purchase order #1005', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 3, toLocationId: null, goodId: 1, quantity: 40, status: 'completed', date: daysAgo(19), notes: 'Sales order #2004', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 4, toLocationId: 1, goodId: 3, quantity: 80, status: 'completed', date: daysAgo(18), notes: 'Consolidate stock', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 1, goodId: 4, quantity: 25, status: 'completed', date: daysAgo(17), notes: 'Purchase order #1006', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 2, toLocationId: null, goodId: 1, quantity: 15, status: 'completed', date: daysAgo(16), notes: 'Sales order #2005', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 4, goodId: 5, quantity: 4, status: 'completed', date: daysAgo(15), notes: 'Purchase order #1007', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 1, toLocationId: 4, goodId: 2, quantity: 25, status: 'completed', date: daysAgo(14), notes: 'Restock East Hub', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 4, toLocationId: null, goodId: 3, quantity: 60, status: 'completed', date: daysAgo(13), notes: 'Sales order #2006', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 1, goodId: 6, quantity: 200, status: 'completed', date: daysAgo(12), notes: 'Purchase order #1008', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 1, toLocationId: null, goodId: 2, quantity: 30, status: 'completed', date: daysAgo(11), notes: 'Sales order #2007', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 3, toLocationId: 2, goodId: 6, quantity: 150, status: 'completed', date: daysAgo(10), notes: 'Rebalance stock', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 2, goodId: 4, quantity: 30, status: 'completed', date: daysAgo(9), notes: 'Purchase order #1009', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 3, toLocationId: null, goodId: 6, quantity: 80, status: 'completed', date: daysAgo(8), notes: 'Sales order #2008', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 1, goodId: 1, quantity: 120, status: 'completed', date: daysAgo(7), notes: 'Purchase order #1010', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 1, toLocationId: 3, goodId: 1, quantity: 50, status: 'completed', date: daysAgo(6), notes: 'Restock South Depot', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 4, toLocationId: null, goodId: 5, quantity: 3, status: 'completed', date: daysAgo(5), notes: 'Sales order #2009', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 2, goodId: 2, quantity: 70, status: 'completed', date: daysAgo(4), notes: 'Purchase order #1011', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 1, toLocationId: null, goodId: 3, quantity: 40, status: 'completed', date: daysAgo(3), notes: 'Sales order #2010', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 2, toLocationId: 4, goodId: 2, quantity: 20, status: 'completed', date: daysAgo(2), notes: 'Rebalance East Hub', userId: 2, createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 3, goodId: 4, quantity: 20, status: 'completed', date: daysAgo(1), notes: 'Purchase order #1012', userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 1, toLocationId: null, goodId: 6, quantity: 50, status: 'completed', date: daysAgo(0), notes: 'Sales order #2011', userId: 2, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Movement Requests
    await queryInterface.bulkInsert('movement_requests', [
      { type: 'in', fromLocationId: null, toLocationId: 1, goodId: 1, quantity: 200, status: 'pending', requestedBy: 2, approvedBy: null, date: daysAgo(3), notes: 'Monthly restocking', createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 1, toLocationId: 2, goodId: 2, quantity: 50, status: 'approved', requestedBy: 2, approvedBy: 1, date: daysAgo(5), notes: 'Low stock at North Depot', createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 3, toLocationId: null, goodId: 6, quantity: 100, status: 'rejected', requestedBy: 2, approvedBy: 1, date: daysAgo(7), notes: 'Customer order', createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 4, goodId: 5, quantity: 10, status: 'pending', requestedBy: 2, approvedBy: null, date: daysAgo(2), notes: 'Equipment restock', createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 2, toLocationId: 3, goodId: 3, quantity: 100, status: 'approved', requestedBy: 2, approvedBy: 1, date: daysAgo(10), notes: 'Seasonal stock move', createdAt: new Date(), updatedAt: new Date() },
      { type: 'out', fromLocationId: 1, toLocationId: null, goodId: 4, quantity: 30, status: 'pending', requestedBy: 2, approvedBy: null, date: daysAgo(1), notes: 'Urgent dispatch', createdAt: new Date(), updatedAt: new Date() },
      { type: 'in', fromLocationId: null, toLocationId: 2, goodId: 6, quantity: 500, status: 'approved', requestedBy: 2, approvedBy: 1, date: daysAgo(15), notes: 'Bulk purchase', createdAt: new Date(), updatedAt: new Date() },
      { type: 'transfer', fromLocationId: 4, toLocationId: 1, goodId: 1, quantity: 80, status: 'rejected', requestedBy: 2, approvedBy: 1, date: daysAgo(20), notes: 'Consolidate main warehouse', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('movement_requests', null, {});
    await queryInterface.bulkDelete('movements', null, {});
    await queryInterface.bulkDelete('stocks', null, {});
    await queryInterface.bulkDelete('goods', null, {});
    await queryInterface.bulkDelete('locations', null, {});
  },
};
