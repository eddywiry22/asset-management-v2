import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessModule } from '@/utils/permissions';

const NAV_ITEMS = [
  { to: '/dashboard',        label: 'Dashboard',         icon: '▦', module: 'dashboard'  },
  { to: '/goods',            label: 'Goods',             icon: '◫', module: 'assets'     },
  { to: '/locations',        label: 'Locations',         icon: '⊙', module: 'locations'  },
  { to: '/categories',       label: 'Categories',        icon: '⊞', module: 'categories' },
  { to: '/vendors',          label: 'Vendors',           icon: '⊟', module: 'vendors'    },
  { to: '/stock',            label: 'Stock',             icon: '▣', module: 'stock'      },
  { to: '/stock-adjustments',label: 'Stock Adjustments', icon: '±', module: 'stock'      },
  { to: '/reports',          label: 'Reports',           icon: '◈', module: 'reports'    },
];

const ADMIN_NAV_ITEMS = [
  { to: '/users',    label: 'Users',    icon: '◎', module: 'users'    },
  { to: '/settings', label: 'Settings', icon: '⚙', module: 'settings' },
];

function NavItem({ to, label, icon, onClose }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClose}
        className={({ isActive }) =>
          [
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
          ].join(' ')
        }
      >
        <span aria-hidden="true">{icon}</span>
        {label}
      </NavLink>
    </li>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role;

  const visibleMain  = NAV_ITEMS.filter(({ module }) => canAccessModule(role, module));
  const visibleAdmin = ADMIN_NAV_ITEMS.filter(({ module }) => canAccessModule(role, module));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-300',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-700 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-base font-bold">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">AssetMS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {visibleMain.map(({ to, label, icon }) => (
              <NavItem key={to} to={to} label={label} icon={icon} onClose={onClose} />
            ))}

            {visibleAdmin.length > 0 && (
              <>
                <li className="pt-4 pb-1">
                  <span className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Administration
                  </span>
                </li>
                {visibleAdmin.map(({ to, label, icon }) => (
                  <NavItem key={to} to={to} label={label} icon={icon} onClose={onClose} />
                ))}
              </>
            )}
          </ul>
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold uppercase">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs capitalize text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-md bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
