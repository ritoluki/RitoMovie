import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '../components/layout/AdminLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Lazy load admin pages
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/AdminUsers'));
const AdminMovies = lazy(() => import('../pages/AdminMovies'));
const AdminComments = lazy(() => import('../pages/AdminComments'));
const AdminReports = lazy(() => import('../pages/AdminReports'));
const AdminAnalytics = lazy(() => import('../pages/AdminAnalytics'));
const AdminAuditLog = lazy(() => import('../pages/AdminAuditLog'));
const AdminSettings = lazy(() => import('../pages/AdminSettings'));

// Admin roles that can access the admin panel
const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'analyst'];

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

// Admin route guard component
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRoutes: React.FC = () => {
  return (
    <AdminGuard>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminUsers />
              </Suspense>
            }
          />
          <Route
            path="movies"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminMovies />
              </Suspense>
            }
          />
          <Route
            path="comments"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminComments />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminReports />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminAnalytics />
              </Suspense>
            }
          />
          <Route
            path="audit-log"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminAuditLog />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminSettings />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AdminGuard>
  );
};

export default AdminRoutes;
