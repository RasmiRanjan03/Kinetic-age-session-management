import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-theme-navbar/90 border-b border-theme px-6 py-4 flex justify-between items-center transition-theme sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-xl font-bold tracking-wider text-brand-600 dark:text-brand-400">
          ⚡ KineticAge
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-theme-card hover:bg-theme-primary text-amber-500 dark:text-brand-400 rounded-xl border border-theme transition-theme"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {user ? (
          <>
            <span className="text-sm text-theme-secondary font-medium">
              Welcome, {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-theme-card hover:bg-theme-primary text-theme-secondary text-xs font-semibold px-3.5 py-2 rounded-xl border border-theme transition-theme"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-theme"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
