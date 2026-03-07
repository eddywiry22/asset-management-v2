'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movement_requests', {
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
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requestedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approvedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('movement_requests', ['date']);
    await queryInterface.addIndex('movement_requests', ['status']);
    await queryInterface.addIndex('movement_requests', ['goodId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movement_requests');
  },
};
