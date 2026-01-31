import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface PublicSettings {
    site_name?: string;
    site_description?: string;
    site_logo?: string;
    maintenance_mode?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    allow_registration?: boolean;
    max_comment_length?: number;
}

interface PublicSettingsResponse {
    success: boolean;
    data: PublicSettings;
}

/**
 * Fetch public settings from API
 */
const fetchPublicSettings = async (): Promise<PublicSettings> => {
    // Axios instance returns response.data directly (already unwrapped)
    // So we get { success: true, data: {...} } directly
    const result = await api.get<PublicSettingsResponse>('/settings/public');
    return result.data;
};

/**
 * Hook to get public settings
 * These settings are cached for 30 minutes and don't require authentication
 */
export const usePublicSettings = () => {
    return useQuery<PublicSettings>({
        queryKey: ['settings', 'public'],
        queryFn: fetchPublicSettings,
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

/**
 * Hook to get a specific setting value
 */
export const useSetting = <T = unknown>(key: keyof PublicSettings, defaultValue?: T) => {
    const { data: settings, ...rest } = usePublicSettings();
    
    const value = settings?.[key] as T | undefined;
    
    return {
        ...rest,
        value: value ?? defaultValue,
    };
};

export default usePublicSettings;
