import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { phimService } from '@/services/phimService';
import { movieService } from '@/services/movieService';
import { buildSearchSuggestions, normalizeKeyword } from '@/lib/searchPalette';

export function useSearchSuggestions(input: string, open: boolean) {
  const keyword = normalizeKeyword(input);
  const [debounced, setDebounced] = useState('');
  const { i18n } = useTranslation();
  useEffect(() => {
    if (!open || keyword.length < 2) { setDebounced(''); return; }
    const timer = setTimeout(() => setDebounced(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword, open]);
  const enabled = open && keyword.length >= 2 && keyword === debounced;
  const phim = useQuery({
    queryKey: ['search-suggestions', 'phim', debounced, i18n.language],
    queryFn: async ({ signal }) => {
      const response = await phimService.search(debounced, { limit: 8, page: 1 }, signal);
      return response.data?.data?.items || [];
    },
    enabled, staleTime: 60000, gcTime: 5 * 60000, retry: false,
  });
  const tmdb = useQuery({
    queryKey: ['search-suggestions', 'tmdb', debounced, i18n.language],
    queryFn: ({ signal }) => movieService.search(debounced, 1, signal),
    enabled, staleTime: 60000, gcTime: 5 * 60000, retry: false,
  });
  const items = enabled ? buildSearchSuggestions(phim.data || [], tmdb.data?.results || [], i18n.language) : [];
  const loading = open && keyword.length >= 2 && (!enabled || phim.isFetching || tmdb.isFetching);
  return { items, loading, failed: enabled && phim.isError && tmdb.isError,
    partial: enabled && (phim.isError || tmdb.isError) && !(phim.isError && tmdb.isError),
    retry: () => { void phim.refetch(); void tmdb.refetch(); } };
}
