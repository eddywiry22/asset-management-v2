import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import GoodsPage from '@/pages/GoodsPage';
import LocationsPage from '@/pages/LocationsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import VendorsPage from '@/pages/VendorsPage';
import StockPage from '@/pages/StockPage';
import StockAdjustmentsPage from '@/pages/StockAdjustmentsPage';
import MovementsListPage from '@/pages/movements/MovementsListPage';
import MovementNewPage from '@/pages/movements/MovementNewPage';
import MovementDetailPage from '@/pages/movements/MovementDetailPage';
import AuditLogPage from '@/pages/AuditLogPage';
import MovementRequestsPage from '@/pages/MovementRequestsPage';
import UsersPage from '@/pages/admin/UsersPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes (wrapped in AuthLayout) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes (wrapped in MainLayout with sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/goods" element={<GoodsPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/stock-adjustments" element={<StockAdjustmentsPage />} />
              <Route path="/movements" element={<MovementsListPage />} />
              <Route path="/movements/new" element={<MovementNewPage />} />
              <Route path="/movements/:id" element={<MovementDetailPage />} />
              <Route path="/movement-requests" element={<MovementRequestsPage />} />

              {/* Admin module: accessible only by admin and warehouse_head */}
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/locations" element={<LocationsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/vendors" element={<VendorsPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
