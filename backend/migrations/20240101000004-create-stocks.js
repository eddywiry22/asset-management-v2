'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stocks', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      locationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      itemId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('stocks', ['locationId', 'itemId'], {
      unique: true,
      name: 'stocks_location_item_unique',
    });
    await queryInterface.addIndex('stocks', ['locationId'], { name: 'stocks_location_idx' });
    await queryInterface.addIndex('stocks', ['itemId'], { name: 'stocks_item_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stocks');
  },
};
