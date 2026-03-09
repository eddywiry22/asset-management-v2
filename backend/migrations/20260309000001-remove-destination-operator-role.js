'use strict';

/**
 * Migration: Remove destination_operator from the users.role ENUM.
 *
 * The destination_operator role has been consolidated into warehouse_operator.
 * A warehouse_operator whose locationId matches a movement's destinationLocationId
 * now handles all destination-side approval and finalization — no separate role
 * name is required.
 *
 * IMPORTANT: Before running this migration, ensure that no users in the database
 * still have role = 'destination_operator'. Re-assign them to 'warehouse_operator'
 * with the appropriate locationId:
 *
 *   UPDATE users SET role = 'warehouse_operator' WHERE role = 'destination_operator';
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Re-assign any remaining destination_operator users to warehouse_operator
    // before the ENUM column is narrowed (avoids constraint violation on ALTER).
    await queryInterface.sequelize.query(
      `UPDATE users SET role = 'warehouse_operator' WHERE role = 'destination_operator'`
    );

    // Narrow the ENUM — removes 'destination_operator' from the allowed values.
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM(
        'admin',
        'manager',
        'viewer',
        'warehouse_operator',
        'warehouse_head'
      ),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore destination_operator to the ENUM so this migration is reversible.
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM(
        'admin',
        'manager',
        'viewer',
        'warehouse_operator',
        'warehouse_head',
        'destination_operator'
      ),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },
};
