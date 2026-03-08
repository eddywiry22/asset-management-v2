'use strict';

/**
 * Migration: Add deleted_at (soft-delete / paranoid) column to users,
 * locations, categories, vendors, and goods tables.
 *
 * Sequelize paranoid mode sets deleted_at instead of issuing a DELETE,
 * preserving foreign-key references for historical data integrity.
 */

const TABLES = ['users', 'locations', 'categories', 'vendors', 'goods'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of TABLES) {
      const tableDesc = await queryInterface.describeTable(table);
      if (!tableDesc.deleted_at) {
        await queryInterface.addColumn(table, 'deleted_at', {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          after: 'updated_at',
        });
      }
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      const tableDesc = await queryInterface.describeTable(table);
      if (tableDesc.deleted_at) {
        await queryInterface.removeColumn(table, 'deleted_at');
      }
    }
  },
};
