import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
}

const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbs = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      return { label, href: index < paths.length - 1 ? href : undefined };
    });
  })();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
      <Link
        to="/admin"
        className="flex items-center hover:text-white transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-600" />
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default AdminBreadcrumb;
