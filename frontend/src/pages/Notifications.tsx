import { useTranslation } from 'react-i18next';
import { NotificationFeed } from '@/components/common/NotificationBell';
export default function Notifications() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto min-h-[60vh] max-w-3xl px-4 py-10 md:py-14">
      <h1 className="mb-2 text-2xl font-bold text-white">
        {t('notifications.title')}
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        {t('notifications.description')}
      </p>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#17191f]">
        <NotificationFeed fullPage />
      </div>
    </div>
  );
}
