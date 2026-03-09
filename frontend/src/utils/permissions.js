/**
 * Client-side mirror of the backend permission matrix.
 *
 * Used exclusively for UI decisions (show/hide menu items, disable buttons).
 * The backend ALWAYS enforces the authoritative permission check.
 *
 * Structure: { [role]: { [module]: [actions] } }
 */
const PERMISSIONS = {
  admin: {
    dashboard:  ['view'],
    assets:     ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    vendors:    ['view', 'create', 'edit', 'delete'],
    locations:  ['view', 'create', 'edit', 'delete'],
    reports:    ['view', 'export'],
    users:      ['view', 'create', 'edit', 'delete'],
    settings:   ['view', 'edit'],
    movements:  ['view', 'create', 'edit', 'delete', 'approve'],
    admin:      ['view', 'create', 'edit', 'delete'],
    audit:      ['view'],
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
  warehouse_operator: {
    dashboard:  ['view'],
    assets:     ['view'],
    movements:  ['view', 'create'],
  },
  warehouse_head: {
    dashboard:  ['view'],
    assets:     ['view'],
    movements:  ['view', 'create', 'approve'],
    categories: ['view', 'create', 'edit', 'delete'],
    vendors:    ['view', 'create', 'edit', 'delete'],
    locations:  ['view', 'create', 'edit', 'delete'],
    users:      ['view', 'create', 'edit', 'delete'],
    admin:      ['view', 'create', 'edit', 'delete'],
    audit:      ['view'],
  },
};

/**
 * Returns true when the given role can perform `action` on `module`.
 * Defaults to false for unknown roles or modules.
 *
 * @param {string|undefined} role
 * @param {string} module
 * @param {string} action
 * @returns {boolean}
 */
export const hasPermission = (role, module, action) => {
  if (!role) return false;
  const rolePerms = PERMISSIONS[role];
  return Boolean(rolePerms && rolePerms[module] && rolePerms[module].includes(action));
};

/**
 * Returns true when `role` has ANY permission on `module`.
 * Useful for deciding whether to show a nav section at all.
 *
 * @param {string|undefined} role
 * @param {string} module
 * @returns {boolean}
 */
export const canAccessModule = (role, module) => {
  if (!role) return false;
  const rolePerms = PERMISSIONS[role];
  return Boolean(rolePerms && rolePerms[module] && rolePerms[module].length > 0);
};
