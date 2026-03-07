'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('movement_headers', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      movementNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      originLocationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      destinationLocationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      requestedById: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING_HEAD_APPROVAL',
          'PENDING_DESTINATION_APPROVAL',
          'APPROVED_READY_FOR_FINALIZATION',
          'COMPLETED',
          'REJECTED'
        ),
        allowNull: false,
        defaultValue: 'PENDING_HEAD_APPROVAL',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      headApprovedById: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      headApprovedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      destApprovedById: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      destApprovedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finalizedById: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      finalizedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejectedById: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rejectedAt: {
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

    await queryInterface.addIndex('movement_headers', ['movementNumber'], {
      unique: true,
      name: 'movement_headers_number_unique',
    });
    await queryInterface.addIndex('movement_headers', ['status'], { name: 'movement_headers_status_idx' });
    await queryInterface.addIndex('movement_headers', ['originLocationId'], { name: 'movement_headers_origin_idx' });
    await queryInterface.addIndex('movement_headers', ['destinationLocationId'], { name: 'movement_headers_dest_idx' });
    await queryInterface.addIndex('movement_headers', ['requestedById'], { name: 'movement_headers_requested_by_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movement_headers');
  },
};
