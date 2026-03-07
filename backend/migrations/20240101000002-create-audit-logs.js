'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true, // null if the actor account is deleted later
      },
      userEmail: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'e.g. CREATE, UPDATE, DELETE',
      },
      entity: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'e.g. Goods',
      },
      entityId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      before: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Snapshot of the record before the change',
      },
      after: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Snapshot of the record after the change',
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

    await queryInterface.addIndex('audit_logs', ['entity', 'entityId'], {
      name: 'audit_logs_entity_idx',
    });
    await queryInterface.addIndex('audit_logs', ['userId'], {
      name: 'audit_logs_user_idx',
    });
    await queryInterface.addIndex('audit_logs', ['action'], {
      name: 'audit_logs_action_idx',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('audit_logs');
  },
};
