import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
  Users,
  CheckCircle,
} from "lucide-react";

const Sidebar = ({ isMobileOpen, setIsMobileOpen, onCollapseChange }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Notify parent component about collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  const getNavigationItems = () => {
    // Show all modules to all roles - access will be controlled by route protection
    const allItems = [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Products", href: "/products", icon: Package },
      { name: "Warehouses", href: "/warehouses", icon: Warehouse },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart },
      { name: "Sales", href: "/sales", icon: Truck },
      { name: "Approved Sales", href: "/approved-sales", icon: CheckCircle },
      { name: "PostEx Orders", href: "/postex-orders", icon: Truck },
      { name: "Suppliers", href: "/suppliers", icon: Building2 },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Finance", href: "/finance", icon: DollarSign },
      { name: "User Management", href: "/users", icon: Users },
      { name: "Settings", href: "/settings", icon: Settings },
    ];

    return allItems;
  };

  const navigation = getNavigationItems();

  const handleNavClick = () => {
    // Close mobile sidebar when a link is clicked
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const SidebarContent = () => (
    <div
      className={`flex grow flex-col gap-y-4 sm:gap-y-5 overflow-y-auto bg-white px-4 sm:px-6 pb-4 shadow-lg transition-all duration-300 ${
        isCollapsed && !isHovered ? "w-20" : "w-60 xl:w-64"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div
        className={`flex h-14 sm:h-16 shrink-0 items-center justify-between pt-4 sm:pt-5 ${
          isCollapsed && !isHovered ? "flex-col space-y-2" : ""
        }`}
      >
        <div className="flex items-center">
          <div
            className={`rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md ${
              isCollapsed && !isHovered
                ? "h-10 w-10"
                : "h-8 w-8 sm:h-10 sm:w-10"
            }`}
          >
            <Package
              className={`text-white ${
                isCollapsed && !isHovered ? "h-6 w-6" : "h-5 w-5 sm:h-6 sm:w-6"
              }`}
            />
          </div>
          {(isHovered || !isCollapsed) && (
            <div className="ml-2 sm:ml-3">
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                Inventory
              </span>
              <p className="text-xs text-gray-500 font-medium">Management</p>
            </div>
          )}
        </div>

        {/* Desktop collapse/expand button */}
        {(isHovered || !isCollapsed) && (
          <button
            onClick={handleCollapseToggle}
            className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}

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
                        isCollapsed && !isHovered ? "justify-center px-3" : ""
                      } ${
                        isActive
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                      }`
                    }
                  >
                    <item.icon
                      className={`shrink-0 ${
                        isCollapsed && !isHovered
                          ? "h-7 w-7"
                          : "h-5 w-5 sm:h-6 sm:w-6"
                      }`}
                      aria-hidden="true"
                    />
                    {(isHovered || !isCollapsed) && (
                      <span className="truncate">{item.name}</span>
                    )}
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
                className={`group flex gap-x-3 rounded-md p-2.5 sm:p-2 text-sm sm:text-base leading-6 font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 w-full transition-colors ${
                  isCollapsed && !isHovered ? "justify-center px-3" : ""
                }`}
              >
                <LogOut
                  className={`shrink-0 ${
                    isCollapsed && !isHovered
                      ? "h-7 w-7"
                      : "h-5 w-5 sm:h-6 sm:w-6"
                  }`}
                  aria-hidden="true"
                />
                {(isHovered || !isCollapsed) && "Logout"}
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
