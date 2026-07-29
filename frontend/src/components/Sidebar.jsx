import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminItems = [
    { name: 'Dashboard', path: '/dashboard/admin', icon: '📊' },
    { name: 'Clients', path: '/dashboard/clients', icon: '👤' },
    { name: 'Subscriptions', path: '/dashboard/subscriptions', icon: '💳' },
    { name: 'Sessions', path: '/dashboard/sessions', icon: '🏃‍♂️' },
    { name: 'Payments', path: '/dashboard/payments', icon: '💰' },
    { name: 'Reports', path: '/dashboard/reports', icon: '📈' },
    { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' },
  ];

  const userItems = [
    { name: 'Dashboard', path: '/dashboard/user', icon: '📊' },
    { name: 'My Sessions', path: '/dashboard/my-sessions', icon: '🏃‍♂️' },
    { name: 'My Subscription', path: '/dashboard/my-subscription', icon: '💳' },
    { name: 'My Payments', path: '/dashboard/my-payments', icon: '💰' },
    { name: 'My Profile', path: '/dashboard/my-profile', icon: '👤' },
  ];

  const filteredItems = user && user.role === 'admin' ? adminItems : userItems;

  return (
    <aside className="w-64 bg-theme-sidebar border-r border-theme p-4 flex flex-col gap-2 fixed top-0 left-0 h-screen z-30 transition-theme">
      <div className="flex-1 flex flex-col gap-2">
        {filteredItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/dashboard/admin' || item.path === '/dashboard/user'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-theme ${
                isActive
                  ? 'bg-brand-600/10 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 font-semibold'
                  : 'text-theme-secondary hover:bg-theme-primary hover:text-theme-primary'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-theme-secondary hover:bg-rose-500/10 hover:text-rose-650 transition-theme border border-transparent mt-auto"
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
