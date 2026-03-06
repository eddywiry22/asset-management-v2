'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('location_logs', {
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
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.ENUM('CREATED', 'UPDATED'),
        allowNull: false,
      },
      changes: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Object mapping field names to { from, to } value pairs',
      },
      performedBy: {
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

    await queryInterface.addIndex('location_logs', ['locationId'], { name: 'location_logs_location_idx' });
    await queryInterface.addIndex('location_logs', ['performedBy'], { name: 'location_logs_performer_idx' });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('location_logs');
  },
};
