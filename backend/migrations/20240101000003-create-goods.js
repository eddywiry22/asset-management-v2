'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('goods', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      vendor: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
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

    await queryInterface.addIndex('goods', ['product_id'], {
      unique: true,
      name: 'goods_product_id_unique',
    });
    await queryInterface.addIndex('goods', ['status'], {
      name: 'goods_status_idx',
    });
    await queryInterface.addIndex('goods', ['category'], {
      name: 'goods_category_idx',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('goods');
  },
};
