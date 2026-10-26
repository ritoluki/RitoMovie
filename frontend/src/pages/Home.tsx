import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HomeSectionRenderer from '@/components/movie/HomeSectionRenderer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScrollIndicator from '@/components/common/ScrollIndicator';
import { useHomeData } from '@/hooks/useHomeData';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import { homeSectionsFrom } from '@/utils/homeSections';

export default function Home() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useHomeData();
  const { isAuthenticated } = useAuthStore();
  const { fetchWatchlist, fetchHistory } = useMovieStore();
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWatchlist().catch(console.error);
    fetchHistory().catch(console.error);
  }, [isAuthenticated, fetchWatchlist, fetchHistory]);
  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!data) return <div role="alert" className="px-4 py-16 text-center text-white">
    <p>{String(error || t('common.noData'))}</p><button className="mt-4 underline" onClick={() => refetch()}>{t('common.retry', { defaultValue: 'Retry' })}</button>
  </div>;
  const sections = homeSectionsFrom(data).filter(section => section.items.length);
  const hero = sections.find(section => section.kind === 'hero');
  return <div className={`min-h-screen ${hero ? '-mt-16 md:-mt-20' : 'pt-4'}`}>
    {hero && <HomeSectionRenderer section={hero} immediate />}
    {hero && <ScrollIndicator className="md:hidden" autoHideDelay={10000} />}
    <div className="relative mt-8 md:mt-12 lg:mt-16 z-10 space-y-8 pb-16">
      {sections.filter(section => section.kind !== 'hero').map((section, index) => <HomeSectionRenderer key={section.id} section={section} immediate={index < 3} />)}
    </div>
  </div>;
}
