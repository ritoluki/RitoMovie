import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Film,
  MessageCircle,
  Flag,
  BarChart3,
  Settings,
  ClipboardList,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Movies', href: '/admin/movies', icon: Film },
  { name: 'Comments', href: '/admin/comments', icon: MessageCircle },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, isMobileOpen, onClose }) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
        <NavLink to="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          {isOpen && (
            <span className="text-xl font-bold text-white">RitoAdmin</span>
          )}
        </NavLink>
        
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/admin'}
              onClick={onClose}
              className={`
                group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${active
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
              />
              {isOpen && (
                <>
                  <span className="ml-3 flex-1">{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-700 p-4">
        <NavLink
          to="/"
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <span className="text-sm">← Back to Site</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col
          bg-[#1a1a1a] border-r border-gray-700
          transition-all duration-300
          ${isOpen ? 'w-64' : 'w-20'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex lg:hidden flex-col w-64
          bg-[#1a1a1a] border-r border-gray-700
          transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
