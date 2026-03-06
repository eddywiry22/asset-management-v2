'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('Warehouse Admin', 'Warehouse Head', 'Warehouse Operator')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    roles.forEach((r) => { roleMap[r.name] = r.id; });

    const modules = ['goods', 'stock', 'locations', 'users', 'roles', 'categories', 'vendors'];

    const permissions = [];

    // Warehouse Admin – full access, no approval required
    modules.forEach((mod) => {
      permissions.push({
        role_id: roleMap['Warehouse Admin'],
        module_name: mod,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_approve: true,
        requires_approval: false,
      });
    });

    // Warehouse Head – full operational access, can approve, no approval required
    modules.forEach((mod) => {
      const isUserManagement = ['users', 'roles'].includes(mod);
      permissions.push({
        role_id: roleMap['Warehouse Head'],
        module_name: mod,
        can_view: true,
        can_create: !isUserManagement,
        can_edit: !isUserManagement,
        can_delete: false,
        can_approve: true,
        requires_approval: false,
      });
    });

    // Warehouse Operator – limited access, requires approval for key actions
    modules.forEach((mod) => {
      const isRestricted = ['users', 'roles', 'categories', 'vendors'].includes(mod);
      permissions.push({
        role_id: roleMap['Warehouse Operator'],
        module_name: mod,
        can_view: !isRestricted,
        can_create: mod === 'stock' || mod === 'goods',
        can_edit: mod === 'stock',
        can_delete: false,
        can_approve: false,
        requires_approval: mod === 'stock' || mod === 'goods',
      });
    });

    await queryInterface.bulkInsert('permissions', permissions);
  },

  async down(queryInterface, _Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name IN ('Warehouse Admin', 'Warehouse Head', 'Warehouse Operator')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleIds = roles.map((r) => r.id);

    if (roleIds.length) {
      await queryInterface.bulkDelete('permissions', {
        role_id: roleIds,
      });
    }
  },
};
