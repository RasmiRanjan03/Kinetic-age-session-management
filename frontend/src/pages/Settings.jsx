import React from 'react';
import { Settings as SettingsIcon, Sun, Moon, Bell, Shield, ChevronRight } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
          <span>KineticAge</span>
          <ChevronRight className="w-3 h-3 text-theme-muted" />
          <span>Settings</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary mt-1">Center Settings</h1>
        <p className="text-sm text-theme-secondary">Manage administrative configurations, security rules, and user interfaces</p>
      </div>

      <div className="bg-theme-card border border-theme rounded-3xl p-8 max-w-2xl mx-auto shadow-theme-card transition-theme space-y-8">
        {/* Theme Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-theme-primary flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Display Appearance
          </h3>
          <div className="flex items-center justify-between p-4 bg-theme-primary/40 border border-theme rounded-2xl">
            <div>
              <p className="text-xs font-semibold text-theme-primary">Toggle Interface Theme</p>
              <p className="text-[10px] text-theme-secondary mt-0.5">Switch between dark modes and light modes</p>
            </div>
            <button
              onClick={toggleTheme}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-theme shadow-lg shadow-brand-600/10 flex items-center gap-1.5"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-theme-primary flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-500" />
            System Notifications
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-theme-primary/40 border border-theme rounded-2xl">
              <div>
                <p className="text-xs font-semibold text-theme-primary">Email Billing Invoices</p>
                <p className="text-[10px] text-theme-secondary mt-0.5">Send transaction details to clients automatically</p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-theme-primary/40 border border-theme rounded-2xl">
              <div>
                <p className="text-xs font-semibold text-theme-primary">Subscription Expiry Alerts</p>
                <p className="text-[10px] text-theme-secondary mt-0.5">Alert clients 7 days prior to membership termination</p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase">Enabled</span>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-theme-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Role & Security
          </h3>
          <div className="p-4 bg-theme-primary/40 border border-theme rounded-2xl text-xs text-theme-secondary leading-relaxed space-y-2">
            <p>
              Role-Based Access Control is active. Your account is verified as an <strong className="text-theme-primary">Admin</strong>, giving you full control over clients, payments, subscriptions, and logs directories.
            </p>
            <p className="text-[10px] text-theme-muted font-mono">
              RBAC Policy: lowercase enums ["admin", "user"]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
