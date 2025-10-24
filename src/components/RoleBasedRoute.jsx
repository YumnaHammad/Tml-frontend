import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/unauthorized',
  requireAllRoles = false 
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role(s)
  const hasRequiredRole = requireAllRoles 
    ? allowedRoles.every(role => user.role === role)
    : allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleBasedRoute;