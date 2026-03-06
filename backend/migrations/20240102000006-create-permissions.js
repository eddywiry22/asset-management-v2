'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      module_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      can_view: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_create: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_edit: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_delete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_approve: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requires_approval: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });

    await queryInterface.addIndex('permissions', ['role_id'], { name: 'permissions_role_id_idx' });
    await queryInterface.addIndex('permissions', ['role_id', 'module_name'], {
      unique: true,
      name: 'permissions_role_module_unique',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('permissions');
  },
};
