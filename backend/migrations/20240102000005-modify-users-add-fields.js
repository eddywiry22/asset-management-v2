'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'name',
    });

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

    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      after: 'location_id',
    });

    await queryInterface.addIndex('users', ['role_id'], { name: 'users_role_id_idx' });
    await queryInterface.addIndex('users', ['location_id'], { name: 'users_location_id_idx' });
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeIndex('users', 'users_status_idx');
    await queryInterface.removeIndex('users', 'users_location_id_idx');
    await queryInterface.removeIndex('users', 'users_role_id_idx');
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'location_id');
    await queryInterface.removeColumn('users', 'role_id');
    await queryInterface.removeColumn('users', 'phone_number');
  },
};
