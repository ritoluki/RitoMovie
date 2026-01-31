/**
 * Settings Hook
 * 
 * Custom hook for using settings throughout the application
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export const useSettings = () => {
  const store = useSettingsStore();

  // Auto-fetch settings on hook usage
  useEffect(() => {
    store.fetchSettings();
  }, [store.fetchSettings]);

  return store;
};

// Hook specifically for getting a single setting value
export const useSetting = <T>(key: string, defaultValue?: T): T => {
  const { getSetting } = useSettingsStore();
  return getSetting(key, defaultValue);
};

// Hook for theme-related settings
export const useThemeSettings = () => {
  const { settings } = useSettingsStore();
  
  return {
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    darkMode: settings.dark_mode_default,
    enableAnimations: settings.enable_animations,
    gridLayoutDefault: settings.grid_layout_default,
  };
};

// Hook for movie-related settings
export const useMovieSettings = () => {
  const { settings } = useSettingsStore();
  
  return {
    moviesPerPage: settings.movies_per_page,
    defaultVideoQuality: settings.default_video_quality,
    autoPlayTrailer: settings.auto_play_trailer,
    showAdsBeforeMovie: settings.show_ads_before_movie,
    enableDownload: settings.enable_download,
    featuredMoviesCount: settings.featured_movies_count,
    trendingMoviesCount: settings.trending_movies_count,
  };
};

// Hook for user-related settings
export const useUserSettings = () => {
  const { settings } = useSettingsStore();
  
  return {
    allowRegistration: settings.allow_registration,
    enableComments: settings.enable_comments,
    enableRatings: settings.enable_ratings,
    enableWatchlist: settings.enable_watchlist,
  };
};

// Hook for footer settings
export const useFooterSettings = () => {
  const { settings } = useSettingsStore();
  
  return {
    footerText: settings.footer_text,
    footerCopyright: settings.footer_copyright,
    footerBuiltWithText: settings.footer_built_with_text,
    socialFacebookUrl: settings.social_facebook_url,
    socialTwitterUrl: settings.social_twitter_url,
    socialInstagramUrl: settings.social_instagram_url,
    socialGithubUrl: settings.social_github_url,
    showVietnamFlagMessage: settings.show_vietnam_flag_message,
  };
};

export default useSettings;