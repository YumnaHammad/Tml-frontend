import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="lg:pl-60 xl:pl-64">
        <Header onMobileMenuClick={() => setIsMobileOpen(true)} />
        <main className="p-3 sm:p-4 md:p-6 lg:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;