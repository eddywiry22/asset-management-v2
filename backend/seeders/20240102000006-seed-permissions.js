'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('admin', 'warehouse_head', 'warehouse_operator')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));
    const modules = ['goods', 'stock', 'locations', 'users', 'roles', 'categories', 'vendors', 'movements'];
    const permissions = [];

    modules.forEach((mod) => {
      permissions.push({
        role_id: roleMap.admin,
        module_name: mod,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_approve: true,
        requires_approval: false,
      });
    });

    modules.forEach((mod) => {
      const isUserManagement = ['users', 'roles'].includes(mod);
      permissions.push({
        role_id: roleMap.warehouse_head,
        module_name: mod,
        can_view: true,
        can_create: !isUserManagement,
        can_edit: !isUserManagement,
        can_delete: false,
        can_approve: true,
        requires_approval: false,
      });
    });

    modules.forEach((mod) => {
      const isRestricted = ['users', 'roles', 'categories', 'vendors'].includes(mod);
      permissions.push({
        role_id: roleMap.warehouse_operator,
        module_name: mod,
        can_view: !isRestricted,
        can_create: mod === 'stock' || mod === 'movements',
        can_edit: mod === 'stock',
        can_delete: false,
        can_approve: false,
        requires_approval: mod === 'stock' || mod === 'movements',
      });
    });

    const validPermissions = permissions.filter((p) => p.role_id);
    if (validPermissions.length) {
      await queryInterface.bulkInsert('permissions', validPermissions);
    }
  },

  async down(queryInterface, _Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name IN ('admin', 'warehouse_head', 'warehouse_operator')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleIds = roles.map((r) => r.id);
    if (roleIds.length) {
      await queryInterface.bulkDelete('permissions', { role_id: roleIds });
    }
  },
};
