'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    if (!table.phone_number) {
      await queryInterface.addColumn('users', 'phone_number', {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: 'name',
      });
    }

    if (!table.role_id) {
      await queryInterface.addColumn('users', 'role_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        after: 'password',
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.location_id) {
      await queryInterface.addColumn('users', 'location_id', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        after: 'role_id',
        references: {
          model: 'locations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.status) {
      await queryInterface.addColumn('users', 'status', {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        after: 'location_id',
      });
    }

    await queryInterface.addIndex('users', ['role_id'], { name: 'users_role_id_idx' }).catch(() => {});
    await queryInterface.addIndex('users', ['location_id'], { name: 'users_location_id_idx' }).catch(() => {});
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' }).catch(() => {});
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeIndex('users', 'users_status_idx').catch(() => {});
    await queryInterface.removeIndex('users', 'users_location_id_idx').catch(() => {});
    await queryInterface.removeIndex('users', 'users_role_id_idx').catch(() => {});
    await queryInterface.removeColumn('users', 'status').catch(() => {});
    await queryInterface.removeColumn('users', 'location_id').catch(() => {});
    await queryInterface.removeColumn('users', 'role_id').catch(() => {});
    await queryInterface.removeColumn('users', 'phone_number').catch(() => {});
  },
};
