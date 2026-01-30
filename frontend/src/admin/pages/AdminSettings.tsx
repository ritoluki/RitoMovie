import React from 'react';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';

const AdminSettings: React.FC = () => {
  return (
    <div>
      <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 p-4">
          <nav className="space-y-1">
            {[
              { label: 'General', active: true },
              { label: 'Appearance', active: false },
              { label: 'SEO', active: false },
              { label: 'Email', active: false },
              { label: 'Security', active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">General Settings</h2>

          <div className="space-y-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                defaultValue="RitoMovie"
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Site Description
              </label>
              <textarea
                rows={3}
                defaultValue="Your favorite movie streaming platform"
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="contact@ritomovie.live"
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between py-4 border-t border-gray-700">
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-sm text-gray-400">
                  Temporarily disable access to the site
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-700">
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
