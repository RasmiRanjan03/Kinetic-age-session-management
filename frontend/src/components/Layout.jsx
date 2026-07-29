import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary flex flex-col transition-theme">
      <div className="pl-64">
        <Navbar />
      </div>
      <div className="flex flex-1 pl-64">
        <Sidebar />
        {/* Keyed on pathname to re-trigger page transition animation on every navigation */}
        <main 
          key={location.pathname} 
          className="flex-1 p-8 overflow-y-auto animate-page-transition"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
