'use strict';

/**
 * Migration: Add warehouse roles to users.role ENUM and add a unique constraint
 * on movement_headers to back up the application-level duplicate detection.
 *
 * Changes:
 *  1. Extend users.role ENUM to include warehouse_operator, warehouse_head,
 *     destination_operator
 *  2. Add unique index on movement_headers (origin_location_id,
 *     destination_location_id) filtered by active statuses — implemented as a
 *     regular composite index since MySQL does not support partial indexes;
 *     the application-level duplicate check remains the primary guard.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Extend users.role ENUM
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

    // 2. Add composite index on movement_headers to support fast duplicate lookups.
    //    A DB-level unique constraint cannot be expressed as partial in MySQL,
    //    so we add an advisory composite index and rely on the SELECT + row-level
    //    locking pattern in the service for the actual uniqueness guarantee.
    await queryInterface
      .addIndex('movement_headers', ['origin_location_id', 'destination_location_id', 'status'], {
        name: 'movement_headers_origin_dest_status_idx',
      })
      .catch(() => {
        // Index may already exist in some environments
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface
      .removeIndex('movement_headers', 'movement_headers_origin_dest_status_idx')
      .catch(() => {});

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },
};
