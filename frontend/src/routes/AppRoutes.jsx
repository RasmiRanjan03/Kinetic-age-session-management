import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Layout & Guards
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import UserRoute from '../components/UserRoute';

// Import Pages
import Landing from '../pages/Landing';
import Dashboard from '../pages/Dashboard';
import UserDashboard from '../pages/UserDashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Clients from '../pages/Clients';
import Subscriptions from '../pages/Subscriptions';
import Sessions from '../pages/Sessions';
import Payments from '../pages/Payments';
import Reports from '../pages/Reports';
import MyProfile from '../pages/MyProfile';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import useAuth from '../hooks/useAuth';

// Redirect route for /dashboard based on active role
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex justify-center items-center">
        <div className="animate-spin rounded-full border-2 border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent w-8 h-8"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return <Navigate to="/dashboard/user" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Root Dashboard Redirector */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Admin Dashboard */}
      <Route
        path="/dashboard/admin"
        element={
          <AdminRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </AdminRoute>
        }
      />

      {/* User Dashboard */}
      <Route
        path="/dashboard/user"
        element={
          <UserRoute>
            <Layout>
              <UserDashboard />
            </Layout>
          </UserRoute>
        }
      />
      
      {/* Clients Registry (Admin Only) */}
      <Route
        path="/dashboard/clients"
        element={
          <AdminRoute>
            <Layout>
              <Clients />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Subscriptions Catalog (Admin Only) */}
      <Route
        path="/dashboard/subscriptions"
        element={
          <AdminRoute>
            <Layout>
              <Subscriptions />
            </Layout>
          </AdminRoute>
        }
      />

      {/* My Subscriptions (User Only) */}
      <Route
        path="/dashboard/my-subscription"
        element={
          <UserRoute>
            <Layout>
              <Subscriptions />
            </Layout>
          </UserRoute>
        }
      />

      {/* Therapy Sessions Tracker (Admin Only) */}
      <Route
        path="/dashboard/sessions"
        element={
          <AdminRoute>
            <Layout>
              <Sessions />
            </Layout>
          </AdminRoute>
        }
      />

      {/* My Sessions (User Only) */}
      <Route
        path="/dashboard/my-sessions"
        element={
          <UserRoute>
            <Layout>
              <Sessions />
            </Layout>
          </UserRoute>
        }
      />

      {/* Payments Ledger (Admin Only) */}
      <Route
        path="/dashboard/payments"
        element={
          <AdminRoute>
            <Layout>
              <Payments />
            </Layout>
          </AdminRoute>
        }
      />

      {/* My Payments (User Only) */}
      <Route
        path="/dashboard/my-payments"
        element={
          <UserRoute>
            <Layout>
              <Payments />
            </Layout>
          </UserRoute>
        }
      />

      {/* Reports Hub (Admin Only) */}
      <Route
        path="/dashboard/reports"
        element={
          <AdminRoute>
            <Layout>
              <Reports />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Settings Panel (Admin Only) */}
      <Route
        path="/dashboard/settings"
        element={
          <AdminRoute>
            <Layout>
              <Settings />
            </Layout>
          </AdminRoute>
        }
      />

      {/* My Profile Panel (User Only) */}
      <Route
        path="/dashboard/my-profile"
        element={
          <UserRoute>
            <Layout>
              <MyProfile />
            </Layout>
          </UserRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
