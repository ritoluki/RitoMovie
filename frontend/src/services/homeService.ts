import api from '@/lib/axios';
import { Movie, PhimMovieSummary } from '@/types';

export interface HomePageBatchData {
    trending: {
        results: Movie[];
    };
    popular: {
        results: Movie[];
    };
    topRated: {
        results: Movie[];
    };
    genres: {
        action: { results: Movie[] };
        comedy: { results: Movie[] };
        horror: { results: Movie[] };
        romance: { results: Movie[] };
    };
    phim: {
        phimBo: { items: PhimMovieSummary[] };
        anime: { items: PhimMovieSummary[] };
        tvShows: { items: PhimMovieSummary[] };
    };
    phimGenres: {
        action: { items: PhimMovieSummary[] };
        comedy: { items: PhimMovieSummary[] };
    };
}

export interface HomePageBatchResponse {
    success: boolean;
    data: HomePageBatchData;
    timestamp: string;
}

/**
 * Fetch all home page data in a single batch request
 * This reduces 13+ individual API calls to just 1 call
 */
export const getHomePageBatch = async (): Promise<HomePageBatchData> => {
    const response = await api.get<HomePageBatchResponse>('/home/batch');
    // Axios already unwraps the response, so response.data contains {trending, popular, etc.}
    // not {success, data: {...}}
    return response.data as unknown as HomePageBatchData;
};

const homeService = {
    getHomePageBatch,
};

export default homeService;
