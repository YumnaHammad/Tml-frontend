import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout, ProtectedRoute, Dashboard, LoginForm } from "./modules";
import RoleBasedRoute from "./components/RoleBasedRoute";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import Login from "./pages/Login";
// RegisterForm removed - registration is disabled
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Sales from "./pages/Sales";
import ApprovedSales from "./pages/ApprovedSales";
import PostExOrderPage from "./pages/PostExOrderPage";
import PostExOrders from "./pages/PostExOrders";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PurchaseFormPage from "./pages/forms/PurchaseFormPage";
import SalesFormPage from "./pages/forms/SalesFormPage";
import SupplierFormPage from "./pages/forms/SupplierFormPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import UserFormPage from "./pages/forms/UserFormPage";
import AddStockPage from "./pages/forms/AddStockPage";
import SearchResults from "./pages/SearchResults";

// Advanced Components
import AdvancedAdminDashboard from "./components/dashboards/AdvancedAdminDashboard";
import AdvancedUserManagement from "./pages/AdvancedUserManagement";
import AdvancedReports from "./pages/AdvancedReports";
import Suppliers from "./pages/Suppliers";
import ExpectedReturns from "./pages/ExpectedReturns";
import CityReports from "./pages/CityReports";
import Finance from "./pages/Finance";
import Unauthorized from "./pages/Unauthorized";

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      {/* Registration disabled - no new users allowed */}
      <Route
        path="/register"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Registration Disabled
              </h1>
              <p className="text-gray-600 mb-4">
                New user registration is currently disabled. Only authorized
                users can access this system.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please contact your administrator if you need access.
              </p>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        }
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
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <RoleBasedDashboard />
            </RoleBasedRoute>
          }
        />

        {/* Regular Dashboard for other roles */}
        <Route
          path="dashboard"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <Dashboard />
            </RoleBasedRoute>
          }
        />

        {/* Core Modules - All roles can access */}
        <Route
          path="products"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <Products />
            </RoleBasedRoute>
          }
        />
        <Route
          path="products/new"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <Products />
            </RoleBasedRoute>
          }
        />
        <Route
          path="products/:id/edit"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <Products />
            </RoleBasedRoute>
          }
        />
        <Route
          path="warehouses"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <Warehouses />
            </RoleBasedRoute>
          }
        />
        <Route
          path="warehouses/new"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <Warehouses />
            </RoleBasedRoute>
          }
        />
        <Route
          path="warehouses/:id/add-stock"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <AddStockPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="sales"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <Sales />
            </RoleBasedRoute>
          }
        />
        <Route
          path="sales/new"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <Sales />
            </RoleBasedRoute>
          }
        />
        <Route
          path="sales/edit/:id"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <SalesFormPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="approved-sales"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <ApprovedSales />
            </RoleBasedRoute>
          }
        />
        <Route
          path="approved-sales/postex-order"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <PostExOrderPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="approved-sales/postex-order/:saleId"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <PostExOrderPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="postex-orders"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <PostExOrders />
            </RoleBasedRoute>
          }
        />
        {/* Purchases - Admin only (managers cannot access) */}
        <Route
          path="purchases"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Purchases />
            </RoleBasedRoute>
          }
        />
        <Route
          path="purchases/new"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Purchases />
            </RoleBasedRoute>
          }
        />
        <Route
          path="finance"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Finance />
            </RoleBasedRoute>
          }
        />

        {/* Search */}
        <Route
          path="search"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager", "agent"]}>
              <SearchResults />
            </RoleBasedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <Reports />
            </RoleBasedRoute>
          }
        />
        <Route
          path="city-reports"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <CityReports />
            </RoleBasedRoute>
          }
        />
        <Route
          path="reports/advanced"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdvancedReports />
            </RoleBasedRoute>
          }
        />

        {/* User Management */}
        <Route
          path="users"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <AdvancedUserManagement />
            </RoleBasedRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <UserFormPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="users/edit/:id"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <UserFormPage />
            </RoleBasedRoute>
          }
        />

        {/* Advanced User Management */}
        <Route
          path="users/advanced"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
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
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <Suppliers />
            </RoleBasedRoute>
          }
        />
        <Route
          path="suppliers/:id"
          element={
            <RoleBasedRoute allowedRoles={["admin", "manager"]}>
              <SupplierDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="suppliers/add"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <SupplierFormPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="suppliers/edit/:id"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <SupplierFormPage />
            </RoleBasedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
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
  useEffect(() => {
    // Clear "0" from number inputs on focus
    const handleNumberInputFocus = (e) => {
      const target = e.target;
      if (target && target.type === "number") {
        const value = target.value;
        if (value === "0" || value === "0.0" || value === "0.00") {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(target, "");
            const inputEvent = new Event("input", { bubbles: true });
            const changeEvent = new Event("change", { bubbles: true });
            target.dispatchEvent(inputEvent);
            target.dispatchEvent(changeEvent);
          } else {
            target.value = "";
            target.dispatchEvent(new Event("input", { bubbles: true }));
            target.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    };

    // Add event listeners
    document.addEventListener("focusin", handleNumberInputFocus, true);

    return () => {
      // Cleanup
      document.removeEventListener("focusin", handleNumberInputFocus, true);
    };
  }, []);

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
                background: "#363636",
                color: "#fff",
                zIndex: 99999,
              },
              success: {
                duration: 2000,
                style: {
                  background: "#10b981",
                  color: "#fff",
                  fontWeight: "500",
                  zIndex: 99999,
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#10b981",
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: "500",
                  zIndex: 99999,
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#ef4444",
                },
              },
              loading: {
                style: {
                  background: "#3b82f6",
                  color: "#fff",
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
