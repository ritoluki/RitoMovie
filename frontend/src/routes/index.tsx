import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Home from '@/pages/Home';

// Lazy load secondary pages
const Browse = lazy(() => import('@/pages/Browse'));
const MovieDetails = lazy(() => import('@/pages/MovieDetails'));
const Watch = lazy(() => import('@/pages/Watch'));
const MyList = lazy(() => import('@/pages/MyList'));
const Profile = lazy(() => import('@/pages/Profile'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const SkeletonTest = lazy(() => import('@/pages/SkeletonTest'));

// Admin routes
const AdminRoutes = lazy(() => import('@/admin/routes/AdminRoutes'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Admin Panel */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="movie/:id" element={<MovieDetails />} />
          <Route path="watch/:id" element={<Watch />} />
          <Route path="skeleton-test" element={<SkeletonTest />} />
          <Route
            path="my-list"
            element={
              <ProtectedRoute>
                <MyList />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

