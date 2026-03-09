'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    if (!table.phone_number) {
      await queryInterface.addColumn('users', 'phone_number', {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
    }

    if (!table.role_id) {
      await queryInterface.addColumn('users', 'role_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.location_id) {
      await queryInterface.addColumn('users', 'location_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.status) {
      await queryInterface.addColumn('users', 'status', {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      });
    }

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'viewer', 'warehouse_operator', 'warehouse_head'),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    });
  },
};
