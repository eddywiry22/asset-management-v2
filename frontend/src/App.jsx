import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import GoodsPage from '@/pages/GoodsPage';
import LocationsPage from '@/pages/LocationsPage';
import StockPage from '@/pages/StockPage';
import StockAdjustmentsPage from '@/pages/StockAdjustmentsPage';
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
              {/* Stock management module */}
              <Route path="/goods" element={<GoodsPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/stock-adjustments" element={<StockAdjustmentsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
