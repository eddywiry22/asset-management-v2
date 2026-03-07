'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movements', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('in', 'out', 'transfer'),
        allowNull: false,
      },
      fromLocationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      toLocationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      goodId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'goods', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'completed',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('movements', ['date']);
    await queryInterface.addIndex('movements', ['goodId']);
    await queryInterface.addIndex('movements', ['type']);
    await queryInterface.addIndex('movements', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movements');
  },
};
