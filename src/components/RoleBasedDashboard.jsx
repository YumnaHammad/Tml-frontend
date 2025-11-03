import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdvancedAdminDashboard from './dashboards/AdvancedAdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading.....</div>;
  }

  switch (user.role) {
    case 'admin':
      return <AdvancedAdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'agent':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

export default RoleBasedDashboard;
