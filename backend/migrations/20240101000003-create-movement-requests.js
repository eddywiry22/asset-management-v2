'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movement_requests', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      requester_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      asset_description: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      source_location_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      destination_location_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING_HEAD_APPROVAL',
          'PENDING_DESTINATION_APPROVAL',
          'APPROVED',
          'REJECTED'
        ),
        allowNull: false,
        defaultValue: 'PENDING_HEAD_APPROVAL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      reviewed_by: {
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

    await queryInterface.addIndex('movement_requests', ['requester_id'], { name: 'mr_requester_idx' });
    await queryInterface.addIndex('movement_requests', ['status'], { name: 'mr_status_idx' });
    await queryInterface.addIndex('movement_requests', ['destination_location_id'], { name: 'mr_dest_location_idx' });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('movement_requests');
  },
};
