import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PrivateRoute = ({ requiredRole }) => {
  const { user, token } = useAuth();

  if (!token) {
    toast.error('Please login first');
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    toast.error('Access denied');
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;