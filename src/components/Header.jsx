import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Search, Menu, ChevronDown, X } from 'lucide-react';

const Header = ({ onMobileMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <div className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-200 bg-white px-3 sm:px-4 shadow-sm lg:px-6 xl:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        onClick={onMobileMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6 items-center">
        {/* Search - Hidden on very small mobile, visible on larger screens */}
        <form 
          className="relative hidden sm:flex flex-1 max-w-md lg:max-w-lg" 
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
        >
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="search-field"
            className="block h-10 w-full border border-gray-200 py-2 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white rounded-lg transition-all"
            placeholder="Search products, suppliers, warehouses..."
            type="search"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        
        <div className="flex items-center gap-x-2 sm:gap-x-3 lg:gap-x-4 ml-auto">
          {/* Mobile Search Icon - Only on very small screens */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden -m-2 p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
          >
            <span className="sr-only">Search</span>
            {showMobileSearch ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Search className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {/* Separator */}
          <div className="hidden md:block h-6 w-px bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-x-2 sm:gap-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md ring-2 ring-blue-100">
                <span className="text-white text-xs sm:text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-gray-400" />
            </button>
            
            {/* Dropdown menu */}
            {showProfileDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                      <p className="text-xs text-gray-400 capitalize mt-1">Role: {user?.role || 'admin'}</p>
                    </div>
                    <button 
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile Settings
                    </button>
                    <button 
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Preferences
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button 
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      {showMobileSearch && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-3 sm:hidden z-50 animate-fade-in">
          <form 
            className="relative w-full"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setShowMobileSearch(false);
              }
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              className="block h-10 w-full border border-gray-200 py-2 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white rounded-lg"
              placeholder="Search products, suppliers, warehouses..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Header;
