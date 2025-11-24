import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import homeService, { HomePageBatchData } from '@/services/homeService';

/**
 * Custom hook to fetch all home page data in a single batch request
 * 
 * Benefits:
 * - Reduces 13+ API calls to just 1 call
 * - Faster initial page load
 * - Lower server load
 * - Better user experience with less loading states
 * 
 * Cache Strategy:
 * - staleTime: 30 minutes - data is considered fresh for 30 mins
 * - gcTime: 1 hour - cached data kept in memory for 1 hour
 * - refetchOnWindowFocus: false - don't refetch when user returns to tab
 */
export const useHomeData = () => {
    const { i18n } = useTranslation();
    const language = i18n.language;

    return useQuery<HomePageBatchData>({
        queryKey: ['home', 'batch', language],
        queryFn: homeService.getHomePageBatch,
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
        refetchOnWindowFocus: false, // Don't refetch on window focus
        retry: 2, // Retry failed requests 2 times
    });
};
