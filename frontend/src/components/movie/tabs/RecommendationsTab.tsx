import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { phimService } from '@/services/phimService';
import PhimCard from '@/components/movie/PhimCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { phimLabel } from '@/utils/phimLocalization';

interface RecommendationsTabProps {
  movieId: number;
  slug?: string;
  mediaType: 'movie' | 'tv';
  isResolvingSource?: boolean;
}

const RecommendationsTab = ({ movieId, slug, mediaType, isResolvingSource }: RecommendationsTabProps) => {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['phim', 'recommendations', slug, movieId, mediaType, i18n.language],
    queryFn: () => phimService.getRecommendations({ slug, tmdbId: movieId > 0 ? movieId : undefined, type: mediaType }),
    enabled: Boolean(slug || movieId > 0) && !isResolvingSource,
    staleTime: query => query.state.data?.partial ? 15000 : 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading || isResolvingSource) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return (
    <div className="text-center py-12 space-y-4" role="alert">
      <p className="text-gray-400">{t('movie.recommendationsUnavailable')}</p>
      <button onClick={() => refetch()} className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700">{t('movie.retryRecommendations')}</button>
    </div>
  );
  if (!data?.items.length) return <p className="text-center text-gray-400 py-12">{t('movie.noRecommendations')}</p>;

  return (
    <section className="space-y-6" data-recommendations>
      <h3 className="text-2xl font-bold text-white">{t('movie.youMightLike')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {data.items.map(movie => (
          <div key={movie.slug} className="min-w-0" data-recommendation={movie.slug}>
            <PhimCard item={movie} />
            <p className="mt-2 text-xs text-gray-400">{[movie.year, movie.quality, phimLabel(movie.lang, i18n.language)].filter(Boolean).join(' · ')}</p>
            <p className="mt-1 text-xs text-yellow-400">{t(`movie.recommendationReasons.${movie.reason}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendationsTab;
