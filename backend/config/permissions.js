/**
 * Role-based permission matrix.
 *
 * Structure: { [role]: { [module]: [actions] } }
 *
 * Modules  : dashboard, assets, categories, reports, users, settings, movements
 * Actions  : view, create, edit, delete, export, approve
 *
 * Warehouse roles:
 *   warehouse_operator  – creates movement requests from their assigned location
 *   warehouse_head      – approves (head stage) and finalizes movements at their location
 *   destination_operator – approves (destination stage) movements targeting their location
 */
const PERMISSIONS = {
  admin: {
    dashboard:  ['view'],
    assets:     ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    reports:    ['view', 'export'],
    users:      ['view', 'create', 'edit', 'delete'],
    settings:   ['view', 'edit'],
    movements:  ['view', 'create', 'edit', 'delete', 'approve'],
  },
  manager: {
    dashboard:  ['view'],
    assets:     ['view', 'create', 'edit'],
    categories: ['view', 'create', 'edit'],
    reports:    ['view', 'export'],
    movements:  ['view', 'create', 'approve'],
  },
  viewer: {
    dashboard:  ['view'],
    assets:     ['view'],
    categories: ['view'],
    reports:    ['view'],
    movements:  ['view'],
  },
  // Warehouse-specific roles for the movement workflow
  warehouse_operator: {
    dashboard:  ['view'],
    assets:     ['view'],
    movements:  ['view', 'create'],
  },
  warehouse_head: {
    dashboard:  ['view'],
    assets:     ['view'],
    movements:  ['view', 'create', 'approve'],
  },
  destination_operator: {
    dashboard:  ['view'],
    assets:     ['view'],
    movements:  ['view', 'approve'],
  },
};

/**
 * Returns true when the given role is allowed to perform `action` on `module`.
 * @param {string} role
 * @param {string} module
 * @param {string} action
 * @returns {boolean}
 */
const hasPermission = (role, module, action) => {
  const rolePerms = PERMISSIONS[role];
  return Boolean(rolePerms && rolePerms[module] && rolePerms[module].includes(action));
};

module.exports = { PERMISSIONS, hasPermission };
