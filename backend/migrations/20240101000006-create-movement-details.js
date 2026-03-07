'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movement_details', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      movementHeaderId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'movement_headers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      },
      originQtyBefore: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      originQtyAfter: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      destinationQtyBefore: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
      },
      destinationQtyAfter: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
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

    await queryInterface.addIndex('movement_details', ['movementHeaderId'], {
      name: 'movement_details_header_idx',
    });
    await queryInterface.addIndex('movement_details', ['itemId'], { name: 'movement_details_item_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movement_details');
  },
};
