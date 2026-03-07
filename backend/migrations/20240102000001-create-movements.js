'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movements', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      asset_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      from_location: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      to_location: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      requested_by_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      approved_by_id: {
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

    await queryInterface.addIndex('movements', ['status'], { name: 'movements_status_idx' });
    await queryInterface.addIndex('movements', ['requested_by_id'], { name: 'movements_requested_by_idx' });
    await queryInterface.addIndex('movements', ['approved_by_id'], { name: 'movements_approved_by_idx' });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('movements');
  },
};
