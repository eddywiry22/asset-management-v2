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
      goods_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'goods', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      location_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
      },
      last_updated_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('stocks', ['goods_id', 'location_id'], {
      unique: true,
      name: 'stocks_goods_location_unique',
    });
    await queryInterface.addIndex('stocks', ['goods_id'], { name: 'stocks_goods_id_idx' });
    await queryInterface.addIndex('stocks', ['location_id'], { name: 'stocks_location_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stocks');
  },
};
