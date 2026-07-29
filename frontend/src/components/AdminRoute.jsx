import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
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

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard/user" replace />;
  }

  return children;
};

export default AdminRoute;
