import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import MovementsListPage from '@/pages/movements/MovementsListPage';
import MovementNewPage from '@/pages/movements/MovementNewPage';
import MovementDetailPage from '@/pages/movements/MovementDetailPage';

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
              {/* Goods Movement module */}
              <Route path="/movements" element={<MovementsListPage />} />
              <Route path="/movements/new" element={<MovementNewPage />} />
              <Route path="/movements/:id" element={<MovementDetailPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
