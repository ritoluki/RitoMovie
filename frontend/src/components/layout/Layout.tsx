import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BackToTop from '../common/BackToTop';
import { useSettingsStore } from '@/store/settingsStore';

const Layout = () => {
  const { fetchSettings, settings, applyThemeSettings } = useSettingsStore();

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply theme settings when settings change
  useEffect(() => {
    applyThemeSettings();
  }, [settings.primary_color, settings.secondary_color, settings.dark_mode_default, applyThemeSettings]);

  // Show maintenance mode if enabled
  if (settings.maintenance_mode) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="mx-auto text-6xl text-yellow-500 mb-4">🔧</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Website đang bảo trì
            </h1>
            <p className="text-gray-400">
              Chúng tôi đang cải tiến website để mang đến trải nghiệm tốt hơn
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Cảm ơn bạn đã kiên nhẫn chờ đợi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Layout;

