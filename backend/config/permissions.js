/**
 * Role-based permission matrix.
 *
 * Structure: { [role]: { [module]: [actions] } }
 *
 * Modules  : dashboard, assets, categories, reports, users, settings
 * Actions  : view, create, edit, delete, export
 */
const PERMISSIONS = {
  admin: {
    dashboard: ['view'],
    assets:     ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    reports:    ['view', 'export'],
    users:      ['view', 'create', 'edit', 'delete'],
    settings:   ['view', 'edit'],
  },
  manager: {
    dashboard:  ['view'],
    assets:     ['view', 'create', 'edit'],
    categories: ['view', 'create', 'edit'],
    reports:    ['view', 'export'],
  },
  viewer: {
    dashboard:  ['view'],
    assets:     ['view'],
    categories: ['view'],
    reports:    ['view'],
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
