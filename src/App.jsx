import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout, ProtectedRoute, Dashboard, LoginForm } from './modules';
import RoleBasedRoute from './components/RoleBasedRoute';
import RoleBasedDashboard from './components/RoleBasedDashboard';
import Login from './pages/Login';
import RegisterForm from './modules/auth/components/RegisterForm';
import Products from './pages/Products';
import Warehouses from './pages/Warehouses';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PurchaseFormPage from './pages/forms/PurchaseFormPage';
import SalesFormPage from './pages/forms/SalesFormPage';
import SupplierFormPage from './pages/forms/SupplierFormPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import UserFormPage from './pages/forms/UserFormPage';
import AddStockPage from './pages/forms/AddStockPage';
import SearchResults from './pages/SearchResults';

// Advanced Components
import AdvancedAdminDashboard from './components/dashboards/AdvancedAdminDashboard';
import AdvancedUserManagement from './pages/AdvancedUserManagement';
import AdvancedReports from './pages/AdvancedReports';
import Suppliers from './pages/Suppliers';
import ExpectedReturns from './pages/ExpectedReturns';
import CityReports from './pages/CityReports';
import Finance from './pages/Finance';
import Unauthorized from './pages/Unauthorized';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/" replace /> : <RegisterForm />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        } 
      >
        {/* Dashboard - Role-based */}
        <Route 
          index 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <RoleBasedDashboard />
            </RoleBasedRoute>
          } 
        />
        
        {/* Regular Dashboard for other roles */}
        <Route 
          path="dashboard" 
          element={<Dashboard />} 
        />
        
        {/* Core Modules */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<Products />} />
        <Route path="products/:id/edit" element={<Products />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="warehouses/new" element={<Warehouses />} />
        <Route path="warehouses/:id/add-stock" element={<AddStockPage />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new" element={<Sales />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="purchases/new" element={<Purchases />} />
        <Route 
          path="finance" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Finance />
            </RoleBasedRoute>
          } 
        />
        
        {/* Search */}
        <Route path="search" element={<SearchResults />} />
        
        {/* Reports */}
        <Route 
          path="reports" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <Reports />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="city-reports" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <CityReports />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="reports/advanced" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdvancedReports />
            </RoleBasedRoute>
          } 
        />
        
        {/* User Management */}
        <Route 
          path="users" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <AdvancedUserManagement />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="users/new" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <UserFormPage />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="users/edit/:id" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <UserFormPage />
            </RoleBasedRoute>
          } 
        />
        
        {/* Advanced User Management */}
        <Route 
          path="users/advanced" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdvancedUserManagement />
            </RoleBasedRoute>
          } 
        />
        
        {/* Unauthorized Page */}
        <Route path="unauthorized" element={<Unauthorized />} />
        
        {/* Suppliers */}
        <Route 
          path="suppliers" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <Suppliers />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="suppliers/:id" 
          element={
            <RoleBasedRoute allowedRoles={['admin', 'manager']}>
              <SupplierDetailPage />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="suppliers/add" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <SupplierFormPage />
            </RoleBasedRoute>
          } 
        />
        <Route 
          path="suppliers/edit/:id" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <SupplierFormPage />
            </RoleBasedRoute>
          } 
        />
        
        {/* Settings */}
        <Route 
          path="settings" 
          element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Settings />
            </RoleBasedRoute>
          } 
        />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            containerStyle={{
              zIndex: 99999,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                zIndex: 99999,
              },
              success: {
                duration: 2000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: '500',
                  zIndex: 99999,
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: '500',
                  zIndex: 99999,
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                  color: '#fff',
                  zIndex: 99999,
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
