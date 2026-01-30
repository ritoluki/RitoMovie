import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AdminHeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuClick,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#1a1a1a] border-b border-gray-700">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          {/* Search (desktop) */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'admin'}</p>
            </div>
            <div className="relative">
              <button className="flex items-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover border-2 border-gray-600"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              title="Logout"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
