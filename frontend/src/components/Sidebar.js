import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/activity', icon: '📝', label: 'Activity Logs' },
    { path: '/strikes', icon: '⚠️', label: 'Strikes' },
    { path: '/staff', icon: '👥', label: 'Staff' }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="text-2xl font-bold">📊 Support</div>
        <div className="text-sm text-gray-400 mt-1">Activity Dashboard</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{user.username}</div>
            <div className="text-xs text-gray-400 capitalize">{user.role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
