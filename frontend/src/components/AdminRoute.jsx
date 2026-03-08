import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_ROLES = ['admin', 'warehouse_head'];

/**
 * Wraps routes that require admin or warehouse_head role.
 * Redirects to /dashboard if the user lacks the required role.
 */
export default function AdminRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!ADMIN_ROLES.includes(user?.role)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
