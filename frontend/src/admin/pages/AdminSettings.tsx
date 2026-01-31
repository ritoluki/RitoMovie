import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RefreshCw, Mail, Shield, Globe, Palette, Settings2, Film, Users, Code, Zap, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSettingsStore } from '@/store/settingsStore';

type SettingCategory = 'general' | 'movie' | 'user' | 'appearance' | 'footer' | 'api' | 'email' | 'performance';

interface SystemSetting {
  _id: string;
  key: string;
  value: unknown;
  category: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isSecret: boolean;
  isPublic: boolean;
}

const categoryIcons: Record<SettingCategory, React.ReactNode> = {
  general: <Settings2 size={18} />,
  movie: <Film size={18} />,
  user: <Users size={18} />,
  appearance: <Palette size={18} />,
  footer: <ExternalLink size={18} />,
  api: <Code size={18} />,
  email: <Mail size={18} />,
  performance: <Zap size={18} />,
};

const categoryLabels: Record<SettingCategory, string> = {
  general: 'General',
  movie: 'Movie Settings',
  user: 'User Management',
  appearance: 'Appearance',
  footer: 'Footer & Social',
  api: 'API & Integration',
  email: 'Email',
  performance: 'Performance',
};

const defaultSettings: Record<SettingCategory, Array<{ key: string; label: string; description: string; type: 'string' | 'number' | 'boolean'; defaultValue: unknown; isPublic?: boolean }>> = {
  general: [
    { key: 'site_name', label: 'Site Name', description: 'The name of your website', type: 'string', defaultValue: 'RitoMovie', isPublic: true },
    { key: 'site_description', label: 'Site Description', description: 'A brief description of your site', type: 'string', defaultValue: 'Your favorite movie streaming platform', isPublic: true },
    { key: 'site_logo_url', label: 'Logo URL', description: 'URL to your main logo', type: 'string', defaultValue: '', isPublic: true },
    { key: 'site_favicon_url', label: 'Favicon URL', description: 'URL to your favicon', type: 'string', defaultValue: '', isPublic: true },
    { key: 'contact_email', label: 'Contact Email', description: 'Public contact email', type: 'string', defaultValue: 'contact@ritomovie.live', isPublic: true },
    { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Temporarily disable access to the site', type: 'boolean', defaultValue: false, isPublic: true },
    { key: 'meta_title', label: 'SEO Title', description: 'Default page title for SEO', type: 'string', defaultValue: 'RitoMovie - Watch Movies Online', isPublic: true },
    { key: 'meta_description', label: 'SEO Description', description: 'Default meta description', type: 'string', defaultValue: 'Watch the latest movies and TV shows online for free', isPublic: true },
    { key: 'meta_keywords', label: 'SEO Keywords', description: 'Comma-separated keywords', type: 'string', defaultValue: 'movies, tv shows, streaming, watch online', isPublic: true },
  ],
  movie: [
    { key: 'movies_per_page', label: 'Movies Per Page', description: 'Number of movies to show per page', type: 'number', defaultValue: 24, isPublic: true },
    { key: 'default_video_quality', label: 'Default Video Quality', description: 'Preferred video quality (720p, 1080p, etc.)', type: 'string', defaultValue: '1080p', isPublic: true },
    { key: 'auto_play_trailer', label: 'Auto Play Trailer', description: 'Automatically play movie trailers', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'show_ads_before_movie', label: 'Show Ads Before Movie', description: 'Display advertisements before movie starts', type: 'boolean', defaultValue: false, isPublic: true },
    { key: 'enable_download', label: 'Enable Download', description: 'Allow users to download movies', type: 'boolean', defaultValue: false, isPublic: true },
    { key: 'featured_movies_count', label: 'Featured Movies Count', description: 'Number of featured movies on homepage', type: 'number', defaultValue: 10, isPublic: true },
    { key: 'trending_movies_count', label: 'Trending Movies Count', description: 'Number of trending movies to show', type: 'number', defaultValue: 20, isPublic: true },
  ],
  user: [
    { key: 'allow_registration', label: 'Allow Registration', description: 'Allow new users to register', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'require_email_verification', label: 'Require Email Verification', description: 'Users must verify email before accessing', type: 'boolean', defaultValue: false },
    { key: 'enable_comments', label: 'Enable Comments', description: 'Allow users to comment on movies', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'enable_ratings', label: 'Enable Ratings', description: 'Allow users to rate movies', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'enable_watchlist', label: 'Enable Watchlist', description: 'Allow users to create watchlists', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'max_login_attempts', label: 'Max Login Attempts', description: 'Lock account after X failed attempts', type: 'number', defaultValue: 5 },
    { key: 'session_timeout_hours', label: 'Session Timeout (hours)', description: 'Auto logout after X hours of inactivity', type: 'number', defaultValue: 24 },
  ],
  appearance: [
    { key: 'primary_color', label: 'Primary Color', description: 'Main brand color (hex)', type: 'string', defaultValue: '#eab308', isPublic: true },
    { key: 'secondary_color', label: 'Secondary Color', description: 'Secondary accent color (hex)', type: 'string', defaultValue: '#dc2626', isPublic: true },
    { key: 'dark_mode_default', label: 'Dark Mode Default', description: 'Enable dark mode by default', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'show_movie_posters', label: 'Show Movie Posters', description: 'Display movie poster images', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'enable_animations', label: 'Enable Animations', description: 'Enable UI animations and transitions', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'grid_layout_default', label: 'Grid Layout Default', description: 'Use grid layout by default (vs list)', type: 'boolean', defaultValue: true, isPublic: true },
  ],
  footer: [
    { key: 'footer_text', label: 'Footer Text', description: 'Main footer description text', type: 'string', defaultValue: 'Điểm đến yêu thích của bạn để xem những bộ phim và chương trình truyền hình hay nhất.', isPublic: true },
    { key: 'footer_copyright', label: 'Copyright Text', description: 'Copyright notice in footer', type: 'string', defaultValue: '© 2026 RitoMovie. Tất cả quyền được bảo lưu.', isPublic: true },
    { key: 'footer_built_with_text', label: 'Built With Text', description: 'Technology attribution text', type: 'string', defaultValue: 'Được xây dựng với ❤️ bằng React, TypeScript & Node.js', isPublic: true },
    { key: 'social_facebook_url', label: 'Facebook URL', description: 'Facebook page URL', type: 'string', defaultValue: '#', isPublic: true },
    { key: 'social_twitter_url', label: 'Twitter URL', description: 'Twitter profile URL', type: 'string', defaultValue: '#', isPublic: true },
    { key: 'social_instagram_url', label: 'Instagram URL', description: 'Instagram profile URL', type: 'string', defaultValue: '#', isPublic: true },
    { key: 'social_github_url', label: 'GitHub URL', description: 'GitHub repository URL', type: 'string', defaultValue: '#', isPublic: true },
    { key: 'show_vietnam_flag_message', label: 'Show Vietnam Flag Message', description: 'Display "Hoàng Sa & Trường Sa" message', type: 'boolean', defaultValue: true, isPublic: true },
  ],
  api: [
    { key: 'tmdb_api_key', label: 'TMDB API Key', description: 'The Movie Database API key', type: 'string', defaultValue: '' },
    { key: 'google_analytics_id', label: 'Google Analytics ID', description: 'GA tracking ID (e.g., G-XXXXXXX)', type: 'string', defaultValue: '', isPublic: true },
    { key: 'facebook_pixel_id', label: 'Facebook Pixel ID', description: 'Facebook Pixel tracking ID', type: 'string', defaultValue: '', isPublic: true },
    { key: 'enable_phim_api', label: 'Enable Phim API', description: 'Use external Phim API for Vietnamese content', type: 'boolean', defaultValue: true },
    { key: 'api_rate_limit_per_minute', label: 'API Rate Limit', description: 'API requests per minute per IP', type: 'number', defaultValue: 60 },
  ],
  email: [
    { key: 'smtp_host', label: 'SMTP Host', description: 'Email server hostname (e.g., smtp.gmail.com)', type: 'string', defaultValue: '' },
    { key: 'smtp_port', label: 'SMTP Port', description: 'Email server port (587 for TLS, 465 for SSL)', type: 'number', defaultValue: 587 },
    { key: 'smtp_user', label: 'SMTP Username', description: 'Email server username (usually your email)', type: 'string', defaultValue: '' },
    { key: 'smtp_password', label: 'SMTP Password', description: 'Email server password or app password', type: 'password', defaultValue: '' },
    { key: 'smtp_from_email', label: 'From Email', description: 'Default sender email address', type: 'string', defaultValue: 'noreply@ritomovie.live' },
    { key: 'smtp_from_name', label: 'From Name', description: 'Default sender name', type: 'string', defaultValue: 'RitoMovie' },
    { key: 'require_email_verification', label: 'Require Email Verification', description: 'Users must verify email after registration', type: 'boolean', defaultValue: false },
    { key: 'enable_newsletter', label: 'Enable Newsletter', description: 'Allow users to subscribe to newsletter', type: 'boolean', defaultValue: true, isPublic: true },
  ],
  performance: [
    { key: 'enable_cache', label: 'Enable Caching', description: 'Enable application caching', type: 'boolean', defaultValue: true },
    { key: 'cache_timeout_minutes', label: 'Cache Timeout (minutes)', description: 'How long to cache data', type: 'number', defaultValue: 15 },
    { key: 'enable_lazy_loading', label: 'Enable Lazy Loading', description: 'Load images and content as needed', type: 'boolean', defaultValue: true, isPublic: true },
    { key: 'image_quality', label: 'Image Quality', description: 'Default image quality (low, medium, high)', type: 'string', defaultValue: 'medium', isPublic: true },
    { key: 'enable_service_worker', label: 'Enable Service Worker', description: 'Enable offline functionality', type: 'boolean', defaultValue: false, isPublic: true },
  ],
};

const AdminSettings: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();
  const { fetchSettings, clearCache } = useSettingsStore();

  // Clear formData when category changes to prevent stale data
  React.useEffect(() => {
    setFormData({});
    setHasChanges(false);
  }, [activeCategory]);

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (settings: Array<{ key: string; value: unknown; category: string }>) =>
      adminService.updateSettings(settings),
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      
      // Clear cache and force refresh main app settings to apply changes immediately
      clearCache();
      fetchSettings(true);
      
      // Clear form data to ensure fresh data from server
      setFormData({});
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error(error || 'Failed to save settings');
    },
  });

  // Initialize settings mutation
  const initMutation = useMutation({
    mutationFn: () => adminService.initializeSettings(),
    onSuccess: () => {
      toast.success('Settings initialized');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      
      // Refresh main app settings
      fetchSettings();
    },
    onError: (error: any) => {
      toast.error(error || 'Failed to initialize settings');
    },
  });

  // Get current value for a setting
  const getSettingValue = (key: string, defaultValue: unknown): unknown => {
    // Check form data first (unsaved changes)
    if (formData[key] !== undefined) {
      return formData[key];
    }

    // Check server data
    const allSettings = (settingsData as any)?.data || {};
    for (const category of Object.values(allSettings)) {
      if (Array.isArray(category)) {
        const setting = category.find((s: SystemSetting) => s.key === key);
        if (setting) {
          return setting.value;
        }
      }
    }

    return defaultValue;
  };

  // Handle input change
  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = () => {
    const settingsToUpdate = defaultSettings[activeCategory].map((setting) => {
      const value = formData[setting.key] ?? getSettingValue(setting.key, setting.defaultValue);
      
      // Debug all settings being saved
      console.log(`[Admin Settings] ${setting.key}:`, {
        formData: formData[setting.key],
        serverValue: getSettingValue(setting.key, setting.defaultValue),
        finalValue: value
      });
      
      return {
        key: setting.key,
        value,
        category: activeCategory,
        description: setting.description,
        type: setting.type,
        isPublic: setting.isPublic ?? false,
      };
    });

    console.log('[Admin Settings] Saving settings:', settingsToUpdate);
    updateMutation.mutate(settingsToUpdate);
  };

  // Render input based on type
  const renderInput = (setting: typeof defaultSettings.general[0]) => {
    const value = getSettingValue(setting.key, setting.defaultValue);

    if (setting.type === 'boolean') {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={Boolean(value)}
            onChange={(e) => handleChange(setting.key, e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
        </label>
      );
    }

    if (setting.type === 'number') {
      return (
        <input
          type="number"
          value={String(value)}
          onChange={(e) => handleChange(setting.key, Number(e.target.value))}
          className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
        />
      );
    }

    if (setting.type === 'password') {
      return (
        <input
          type="password"
          value={String(value || '')}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
        />
      );
    }

    return (
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => handleChange(setting.key, e.target.value)}
        className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentSettings = defaultSettings[activeCategory];

  return (
    <div>
      <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Configure system settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearCache();
              fetchSettings(true);
              toast.success('Settings cache cleared and refreshed');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh Cache
          </button>
          <button
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={initMutation.isPending ? 'animate-spin' : ''} />
            Initialize Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 p-4 h-fit">
          <nav className="space-y-1">
            {(Object.keys(categoryLabels) as SettingCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setFormData({});
                  setHasChanges(false);
                }}
                className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {categoryIcons[category]}
                {categoryLabels[category]}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-3 bg-[#1a1a1a] rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600/20 rounded-lg text-red-500">
              {categoryIcons[activeCategory]}
            </div>
            <h2 className="text-lg font-semibold text-white">
              {categoryLabels[activeCategory]} Settings
            </h2>
          </div>

          <div className="space-y-6">
            {currentSettings.map((setting) => (
              <div
                key={setting.key}
                className={`${
                  setting.type === 'boolean'
                    ? 'flex items-center justify-between py-4 border-b border-gray-700'
                    : ''
                }`}
              >
                {setting.type === 'boolean' ? (
                  <>
                    <div>
                      <p className="text-white font-medium">{setting.label}</p>
                      <p className="text-sm text-gray-400">{setting.description}</p>
                    </div>
                    {renderInput(setting)}
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {setting.label}
                    </label>
                    {renderInput(setting)}
                    <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                  </>
                )}
              </div>
            ))}

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-700 flex items-center justify-between">
              <div>
                {hasChanges && (
                  <span className="text-sm text-yellow-500">You have unsaved changes</span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
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
