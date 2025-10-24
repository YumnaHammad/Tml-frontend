import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  TrendingUp,
  Crown,
  Building2,
  UserCheck,
  X,
  MapPin,
  Users
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
    ];

    // Add role-specific items
    if (user?.role === 'admin' || user?.role === 'manager') {
      baseItems.push(
        { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
        { name: 'Sales', href: '/sales', icon: Truck },
        { name: 'Suppliers', href: '/suppliers', icon: Building2 },
        { name: 'Reports', href: '/reports', icon: BarChart3 }
      );
    }

    // Add admin-only items
    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'Finance', href: '/finance', icon: DollarSign }
      );
    }

    if (user?.role === 'employee') {
      baseItems.push(
        { name: 'My Tasks', href: '/tasks', icon: Activity },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Reports', href: '/reports', icon: BarChart3 }
      );
    }

    // Add admin-only routes
    if (user?.role === 'admin') {
      baseItems.push(
        { name: 'User Management', href: '/users', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings }
      );
    }

    // Managers don't get user management access at all

    // Add admin and manager routes
    // if (user?.role === 'admin' || user?.role === 'manager') {
    //   baseItems.push(
    //     { name: 'Suppliers', href: '/suppliers', icon: Building2 }
    //   );
    // }

    return baseItems;
  };

  const navigation = getNavigationItems();

  const handleNavClick = () => {
    // Close mobile sidebar when a link is clicked
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-4 sm:gap-y-5 overflow-y-auto bg-white px-4 sm:px-6 pb-4 shadow-lg">
        {/* Logo Section */}
      <div className="flex h-14 sm:h-16 shrink-0 items-center justify-between pt-4 sm:pt-5">
          <div className="flex items-center">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          <div className="ml-2 sm:ml-3">
            <span className="text-lg sm:text-xl font-bold text-gray-900">Inventory</span>
              <p className="text-xs text-gray-500 font-medium">Management</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                    onClick={handleNavClick}
                      className={({ isActive }) =>
                      `group flex gap-x-3 rounded-md p-2.5 sm:p-2 text-sm sm:text-base leading-6 font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <item.icon
                      className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                        aria-hidden="true"
                      />
                    <span className="truncate">{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="border-t border-gray-200 pt-4">
                <button
                onClick={() => {
                  logout();
                  handleNavClick();
                }}
                className="group flex gap-x-3 rounded-md p-2.5 sm:p-2 text-sm sm:text-base leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" aria-hidden="true" />
                  Logout
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 sm:w-72 flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 xl:w-64 lg:flex-col">
        <SidebarContent />
    </div>
    </>
  );
};

export default Sidebar;
