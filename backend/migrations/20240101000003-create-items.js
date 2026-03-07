'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('items', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pcs',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('items', ['sku'], { unique: true, name: 'items_sku_unique' });
    await queryInterface.addIndex('items', ['isActive'], { name: 'items_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('items');
  },
};
