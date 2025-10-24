// Frontend Module Exports
// This file exports all modules for easy importing

// Auth Module
export { default as LoginForm } from './auth/components/LoginForm';

// Products Module
export { default as ProductList } from './products/components/ProductList';
export { default as ProductForm } from './products/components/ProductForm';
// export { default as ProductDetail } from './products/components/ProductDetail';

// Dashboard Module
export { default as Dashboard } from './dashboard/components/Dashboard';

// Shared Components
export { default as Layout } from '../components/Layout';
export { default as ProtectedRoute } from '../components/ProtectedRoute';
export { default as LoadingSpinner } from '../components/LoadingSpinner';
export { default as ErrorBoundary } from '../components/ErrorBoundary';
