'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'location_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      after: 'role',
    });

    // Extend role enum to include warehouse-specific roles
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'viewer', 'warehouse_head', 'operator', 'requester'),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'location_id');
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },
};
