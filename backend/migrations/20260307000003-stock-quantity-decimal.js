'use strict';

/**
 * Migration: Change stock.quantity from INTEGER UNSIGNED to DECIMAL(15,4)
 *
 * BUG-01/BUG-06: Stock.quantity was INTEGER while MovementDetail.quantity is
 * DECIMAL(15,4). Fractional movement quantities were silently truncated when
 * written back to stock, causing audit snapshot divergence at finalization.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('stock', 'quantity', {
      type: Sequelize.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('stock', 'quantity', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
  },
};
