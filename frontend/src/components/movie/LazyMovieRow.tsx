import { Movie } from '@/types';
import MovieRow from './MovieRow';
import LazyLoadSection from '@/components/common/LazyLoadSection';
import SkeletonMovieRow from '@/components/common/SkeletonMovieRow';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movieService';
import { useTranslation } from 'react-i18next';
import { useLazyLoadStore } from '@/store/lazyLoadStore';

interface LazyMovieRowProps {
    title: string;
    link?: string;
    genreId?: number;
    type?: 'trending' | 'popular' | 'topRated' | 'genre';
    sectionId: string;
    previousSectionId?: string;
}

/**
 * MovieRow với lazy loading - chỉ fetch data khi user scroll đến section này
 */
const LazyMovieRow = ({ title, link, genreId, type = 'genre', sectionId, previousSectionId }: LazyMovieRowProps) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const { i18n } = useTranslation();
    const language = i18n.language;
    const { canLoad, setLoadingSection, markAsLoaded } = useLazyLoadStore();

    // Kiểm tra xem có được phép load không
    const isAllowedToLoad = canLoad(sectionId, previousSectionId);

    // Sử dụng useQuery trực tiếp với enabled flag
    const { data, isLoading } = useQuery({
        queryKey: ['movies', type, genreId, language],
        queryFn: async () => {
            setLoadingSection(sectionId);
            if (type === 'trending') {
                return await movieService.getTrending('week');
            } else if (type === 'popular') {
                return await movieService.getPopular(1);
            } else if (type === 'topRated') {
                return await movieService.getTopRated(1);
            } else if (type === 'genre' && genreId) {
                return await movieService.getByGenre(genreId, 1);
            }
            return { results: [] };
        },
        enabled: shouldLoad && isAllowedToLoad, // Chỉ fetch khi shouldLoad = true VÀ được phép load
        staleTime: 5 * 60 * 1000, // Cache 5 phút
    });

    // Đánh dấu đã load xong khi có data
    useEffect(() => {
        if (data && !isLoading) {
            markAsLoaded(sectionId);
        }
    }, [data, isLoading, sectionId, markAsLoaded]);

    const movies = data?.results || [];

    return (
        <LazyLoadSection
            fallback={<SkeletonMovieRow />}
            rootMargin="0px"
            threshold={0.5}
            onVisible={() => setShouldLoad(true)}
        >
            {isLoading || !shouldLoad ? (
                <SkeletonMovieRow />
            ) : movies.length > 0 ? (
                <div className="animate-fade-in">
                    <MovieRow title={title} movies={movies} link={link} />
                </div>
            ) : null}
        </LazyLoadSection>
    );
};

export default LazyMovieRow;
