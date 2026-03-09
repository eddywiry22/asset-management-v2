'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Keep this demo seeder canonical and lightweight to avoid conflicting with the
    // newer structured seed set (roles/categories/vendors/users/goods/stock).
    await queryInterface.bulkInsert('movement_requests', [
      { fromLocationId: 1, toLocationId: 2, status: 'PENDING', requestedBy: 1, createdAt: now, updatedAt: now },
      { fromLocationId: 2, toLocationId: 1, status: 'IN_TRANSIT', requestedBy: 1, createdAt: now, updatedAt: now },
      { fromLocationId: 1, toLocationId: 3, status: 'APPROVED', requestedBy: 1, createdAt: now, updatedAt: now },
      { fromLocationId: 3, toLocationId: 1, status: 'REJECTED', requestedBy: 1, createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('movement_requests', {
      requestedBy: 1,
    });
  },
};
