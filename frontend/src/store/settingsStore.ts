/**
 * Settings Store for Main Application
 * 
 * This store manages public settings that affect the main website UI.
 * It fetches settings from the backend and applies them to the application.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

export interface PublicSettings {
    // General
    site_name: string;
    site_description: string;
    site_logo_url: string;
    site_favicon_url: string;
    contact_email: string;
    maintenance_mode: boolean;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;

    // Movie
    movies_per_page: number;
    default_video_quality: string;
    auto_play_trailer: boolean;
    show_ads_before_movie: boolean;
    enable_download: boolean;
    featured_movies_count: number;
    trending_movies_count: number;

    // User
    allow_registration: boolean;
    enable_comments: boolean;
    enable_ratings: boolean;
    enable_watchlist: boolean;

    // Appearance
    primary_color: string;
    secondary_color: string;
    dark_mode_default: boolean;
    show_movie_posters: boolean;
    enable_animations: boolean;
    grid_layout_default: boolean;

    // Footer
    footer_text: string;
    footer_copyright: string;
    footer_built_with_text: string;
    social_facebook_url: string;
    social_twitter_url: string;
    social_instagram_url: string;
    social_github_url: string;
    show_vietnam_flag_message: boolean;

    // API (public only)
    google_analytics_id: string;
    facebook_pixel_id: string;
    enable_phim_api: boolean;

    // Email (public only)
    enable_newsletter: boolean;

    // Performance
    enable_lazy_loading: boolean;
    image_quality: string;
    enable_service_worker: boolean;

    // Allow additional dynamic settings
    [key: string]: unknown;
}

// Default settings fallback
const DEFAULT_SETTINGS: PublicSettings = {
    site_name: 'RitoMovie',
    site_description: 'Your favorite movie streaming platform',
    site_logo_url: '',
    site_favicon_url: '',
    contact_email: 'contact@ritomovie.live',
    maintenance_mode: false,
    meta_title: 'RitoMovie - Watch Movies Online',
    meta_description: 'Watch the latest movies and TV shows online for free',
    meta_keywords: 'movies, tv shows, streaming, watch online',

    movies_per_page: 24,
    default_video_quality: '1080p',
    auto_play_trailer: true,
    show_ads_before_movie: false,
    enable_download: false,
    featured_movies_count: 10,
    trending_movies_count: 20,

    allow_registration: true,
    enable_comments: true,
    enable_ratings: true,
    enable_watchlist: true,

    primary_color: '#eab308',
    secondary_color: '#dc2626',
    dark_mode_default: true,
    show_movie_posters: true,
    enable_animations: true,
    grid_layout_default: true,

    footer_text: 'Điểm đến yêu thích của bạn để xem những bộ phim và chương trình truyền hình hay nhất.',
    footer_copyright: '© 2026 RitoMovie. Tất cả quyền được bảo lưu.',
    footer_built_with_text: 'Được xây dựng với ❤️ bằng React, TypeScript & Node.js',
    social_facebook_url: '#',
    social_twitter_url: '#',
    social_instagram_url: '#',
    social_github_url: '#',
    show_vietnam_flag_message: true,

    google_analytics_id: '',
    facebook_pixel_id: '',
    enable_phim_api: true,

    enable_newsletter: true,

    enable_lazy_loading: true,
    image_quality: 'medium',
    enable_service_worker: false,
};

interface SettingsStore {
    settings: PublicSettings;
    isLoading: boolean;
    lastFetched: number | null;
    fetchSettings: (force?: boolean) => Promise<void>;
    clearCache: () => void;
    updateSetting: (key: keyof PublicSettings, value: any) => void;
    getSetting: <T>(key: keyof PublicSettings, defaultValue?: T) => T;
    applyThemeSettings: () => void;
}

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute for faster updates

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            isLoading: false,
            lastFetched: null,

            fetchSettings: async (force = false) => {
                const { lastFetched } = get();
                const now = Date.now();

                console.log('[Settings Store] Fetch settings called', { force, lastFetched });

                // If force refresh, clear localStorage cache first
                if (force) {
                    console.log('[Settings Store] Force refresh - clearing localStorage');
                    localStorage.removeItem('app-settings');
                }

                // Skip if recently fetched (unless force refresh)
                if (!force && lastFetched && (now - lastFetched) < CACHE_DURATION) {
                    console.log('[Settings Store] Using cached settings');
                    return;
                }

                set({ isLoading: true });

                try {
                    console.log('[Settings Store] Fetching from API...');
                    const response = await api.get<any>('/settings/public');

                    console.log('[Settings Store] API Response:', response);

                    // Axios interceptor returns response.data which is { success: true, data: {...} }
                    // So we need to extract response.data to get the actual settings
                    const publicSettings = response.data || response;

                    console.log('[Settings Store] Settings fetched:', publicSettings);

                    // Merge with defaults to ensure all required fields exist
                    const mergedSettings = { ...DEFAULT_SETTINGS, ...publicSettings };

                    set({
                        settings: mergedSettings,
                        lastFetched: now,
                        isLoading: false
                    });

                    console.log('[Settings Store] Settings updated in store:', mergedSettings);

                    // Apply theme settings immediately
                    get().applyThemeSettings();
                } catch (error) {
                    console.error('[Settings Store] Failed to fetch public settings:', error);
                    set({ isLoading: false });
                }
            },

            clearCache: () => {
                console.log('[Settings Store] Clearing cache...');
                localStorage.removeItem('app-settings');
                set({
                    settings: DEFAULT_SETTINGS,
                    lastFetched: null
                });
                console.log('[Settings Store] Cache cleared, reset to defaults');
            },

            updateSetting: (key, value) => {
                set((state) => ({
                    settings: { ...state.settings, [key]: value }
                }));

                // Apply theme if it's a theme-related setting
                if (['primary_color', 'secondary_color', 'dark_mode_default'].includes(String(key))) {
                    get().applyThemeSettings();
                }
            },

            getSetting: (key, defaultValue) => {
                const { settings } = get();
                const value = settings[key];
                return value !== undefined ? value as any : defaultValue;
            },

            applyThemeSettings: () => {
                const { settings } = get();

                console.log('[Settings Store] Applying theme settings:', {
                    primary_color: settings.primary_color,
                    secondary_color: settings.secondary_color,
                    dark_mode: settings.dark_mode_default,
                    site_name: settings.site_name,
                    favicon: settings.site_favicon_url
                });

                // Apply CSS custom properties for colors
                if (typeof document !== 'undefined') {
                    const root = document.documentElement;

                    // Set custom CSS properties
                    root.style.setProperty('--color-primary', settings.primary_color);
                    root.style.setProperty('--color-secondary', settings.secondary_color);

                    // Apply dark mode
                    if (settings.dark_mode_default) {
                        root.classList.add('dark');
                    } else {
                        root.classList.remove('dark');
                    }

                    // Update document title
                    if (settings.site_name && settings.site_name !== DEFAULT_SETTINGS.site_name) {
                        document.title = settings.meta_title || settings.site_name;
                    }

                    // Update favicon if provided
                    if (settings.site_favicon_url) {
                        let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
                        if (!faviconLink) {
                            faviconLink = document.createElement('link');
                            faviconLink.rel = 'icon';
                            document.head.appendChild(faviconLink);
                        }
                        faviconLink.href = settings.site_favicon_url;
                    }

                    // Update meta tags
                    const updateMetaTag = (name: string, content: string) => {
                        let metaTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
                        if (!metaTag) {
                            metaTag = document.createElement('meta');
                            metaTag.name = name;
                            document.head.appendChild(metaTag);
                        }
                        metaTag.content = content;
                    };

                    updateMetaTag('description', settings.meta_description);
                    updateMetaTag('keywords', settings.meta_keywords);
                }
            },
        }),
        {
            name: 'app-settings',
            partialize: (state) => ({
                settings: state.settings,
                lastFetched: state.lastFetched
            }),
        }
    )
);