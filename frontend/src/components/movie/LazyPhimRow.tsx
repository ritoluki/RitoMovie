import PhimRow from './PhimRow';
import LazyLoadSection from '@/components/common/LazyLoadSection';
import SkeletonMovieRow from '@/components/common/SkeletonMovieRow';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CatalogQuery, CatalogType, phimService } from '@/services/phimService';
import { PhimCatalogData } from '@/types';
import { useLazyLoadStore } from '@/store/lazyLoadStore';

interface LazyPhimRowProps {
    title: string;
    catalogType?: CatalogType;
    genreSlug?: string;
    params?: CatalogQuery;
    sectionId: string;
    previousSectionId?: string;
}

/**
 * PhimRow với lazy loading - chỉ fetch data khi user scroll đến section này
 */
const LazyPhimRow = ({ title, catalogType, genreSlug, params, sectionId, previousSectionId }: LazyPhimRowProps) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const { canLoad, setLoadingSection, markAsLoaded } = useLazyLoadStore();

    // Kiểm tra xem có được phép load không
    const isAllowedToLoad = canLoad(sectionId, previousSectionId);

    // Sử dụng useQuery trực tiếp với enabled flag
    const { data, isLoading } = useQuery({
        queryKey: ['phim', catalogType || genreSlug, JSON.stringify(params)],
        queryFn: async () => {
            setLoadingSection(sectionId);
            if (catalogType) {
                const response = await phimService.getCatalogList(catalogType, params);
                // Backend structure: { success: true, data: { status, msg, data: { items: [...] } } }
                if ('data' in response && response.data && 'data' in response.data) {
                    return response.data.data as PhimCatalogData;
                }
                if ('data' in response && response.data) {
                    return response.data as unknown as PhimCatalogData;
                }
                return response as unknown as PhimCatalogData;
            } else if (genreSlug) {
                const response = await phimService.getGenreDetail(genreSlug, params);
                // Backend structure: { success: true, data: { status, msg, data: { items: [...] } } }
                if ('data' in response && response.data && 'data' in response.data) {
                    return response.data.data as PhimCatalogData;
                }
                if ('data' in response && response.data) {
                    return response.data as unknown as PhimCatalogData;
                }
                return response as unknown as PhimCatalogData;
            }
            return { items: [] } as PhimCatalogData;
        },
        enabled: shouldLoad && isAllowedToLoad, // Chỉ fetch khi shouldLoad = true VÀ được phép load
        staleTime: 2 * 60 * 1000, // Cache 2 phút
    });

    // Đánh dấu đã load xong khi có data
    useEffect(() => {
        if (data && !isLoading) {
            markAsLoaded(sectionId);
        }
    }, [data, isLoading, sectionId, markAsLoaded]);

    const items = data?.items || [];

    return (
        <LazyLoadSection
            fallback={<SkeletonMovieRow />}
            rootMargin="0px"
            threshold={0.5}
            onVisible={() => setShouldLoad(true)}
        >
            {isLoading || !shouldLoad ? (
                <SkeletonMovieRow />
            ) : items.length > 0 ? (
                <div className="animate-fade-in">
                    <PhimRow title={title} items={items} />
                </div>
            ) : null}
        </LazyLoadSection>
    );
};

export default LazyPhimRow;
