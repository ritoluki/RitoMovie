/**
 * Settings Service
 * 
 * This service loads settings from database and provides them to the application.
 * Settings are cached in memory and refreshed periodically.
 */

import SystemSetting, { ISystemSetting } from '../models/SystemSetting';
import { apiCache, CACHE_TTL } from '../utils/cache';

// Type definitions for settings
export interface AppSettings {
    // General
    site_name: string;
    site_description: string;
    site_logo: string;
    maintenance_mode: boolean;

    // SEO
    meta_title: string;
    meta_description: string;
    meta_keywords: string;

    // Email
    smtp_host: string;
    smtp_port: string;
    smtp_user: string;
    smtp_password: string;
    email_from: string;

    // Security
    max_login_attempts: number;
    lockout_duration: number;
    require_email_verification: boolean;
    allow_registration: boolean;

    // Content
    comments_require_approval: boolean;
    max_comment_length: number;

    // Allow additional dynamic settings
    [key: string]: unknown;
}

// Default settings (used when database is empty or setting not found)
const DEFAULT_SETTINGS: Partial<AppSettings> = {
    site_name: 'RitoMovie',
    site_description: 'Your favorite movie streaming platform',
    site_logo: '',
    maintenance_mode: false,
    meta_title: 'RitoMovie - Stream Movies Online',
    meta_description: 'Watch your favorite movies and TV shows online',
    meta_keywords: 'movies, streaming, watch online',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    email_from: 'noreply@ritomovie.com',
    max_login_attempts: 5,
    lockout_duration: 15,
    require_email_verification: false,
    allow_registration: true,
    comments_require_approval: false,
    max_comment_length: 1000,
};

// In-memory settings store
let settingsStore: Partial<AppSettings> = { ...DEFAULT_SETTINGS };
let lastLoadTime: number = 0;

const CACHE_KEY = 'app:settings';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Load all settings from database
 */
export const loadSettings = async (): Promise<Partial<AppSettings>> => {
    try {
        const settings = await SystemSetting.find();

        // Convert array to object
        const settingsObject: Partial<AppSettings> = { ...DEFAULT_SETTINGS };

        for (const setting of settings) {
            settingsObject[setting.key] = setting.value;
        }

        // Update in-memory store
        settingsStore = settingsObject;
        lastLoadTime = Date.now();

        // Also update cache
        apiCache.set(CACHE_KEY, settingsObject, CACHE_TTL.MEDIUM);

        console.log('[SettingsService] Settings loaded from database');
        return settingsObject;
    } catch (error) {
        console.error('[SettingsService] Error loading settings:', error);
        return settingsStore; // Return cached/default settings on error
    }
};

/**
 * Get all settings (from cache or load from database)
 */
export const getSettings = async (): Promise<Partial<AppSettings>> => {
    // Check if we need to refresh
    const needsRefresh = Date.now() - lastLoadTime > REFRESH_INTERVAL;

    if (needsRefresh) {
        return loadSettings();
    }

    // Try cache first
    const cached = apiCache.get<Partial<AppSettings>>(CACHE_KEY);
    if (cached) {
        return cached;
    }

    // Load from database
    return loadSettings();
};

/**
 * Get a single setting value
 */
export const getSetting = async <T = unknown>(key: string, defaultValue?: T): Promise<T> => {
    const settings = await getSettings();
    const value = settings[key];

    if (value === undefined || value === null) {
        return defaultValue as T;
    }

    return value as T;
};

/**
 * Get setting synchronously (from in-memory store)
 * Use this when you can't use async/await
 */
export const getSettingSync = <T = unknown>(key: string, defaultValue?: T): T => {
    const value = settingsStore[key];

    if (value === undefined || value === null) {
        return defaultValue as T;
    }

    return value as T;
};

/**
 * Update a setting in database and refresh cache
 */
export const updateSetting = async (
    key: string,
    value: unknown,
    userId: string
): Promise<ISystemSetting | null> => {
    try {
        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { value, updatedBy: userId },
            { new: true }
        );

        // Refresh cache
        await loadSettings();

        return setting;
    } catch (error) {
        console.error('[SettingsService] Error updating setting:', error);
        throw error;
    }
};

/**
 * Get public settings only (for unauthenticated requests)
 */
export const getPublicSettings = async (): Promise<Record<string, unknown>> => {
    const cacheKey = 'app:settings:public';

    // Try cache first
    const cached = apiCache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
        return cached;
    }

    const settings = await SystemSetting.find({ isPublic: true, isSecret: false });

    const publicSettings: Record<string, unknown> = {};
    for (const setting of settings) {
        publicSettings[setting.key] = setting.value;
    }

    // Cache for longer since public settings change less frequently
    apiCache.set(cacheKey, publicSettings, CACHE_TTL.LONG);

    return publicSettings;
};

/**
 * Check if maintenance mode is enabled
 */
export const isMaintenanceMode = (): boolean => {
    return getSettingSync<boolean>('maintenance_mode', false);
};

/**
 * Check if registration is allowed
 */
export const isRegistrationAllowed = (): boolean => {
    return getSettingSync<boolean>('allow_registration', true);
};

/**
 * Get email configuration
 */
export const getEmailConfig = async () => {
    return {
        host: await getSetting<string>('smtp_host', ''),
        port: parseInt(await getSetting<string>('smtp_port', '587'), 10),
        user: await getSetting<string>('smtp_user', ''),
        password: await getSetting<string>('smtp_password', ''),
        from: await getSetting<string>('email_from', 'noreply@ritomovie.com'),
    };
};

/**
 * Get security configuration
 */
export const getSecurityConfig = async () => {
    return {
        maxLoginAttempts: await getSetting<number>('max_login_attempts', 5),
        lockoutDuration: await getSetting<number>('lockout_duration', 15),
        requireEmailVerification: await getSetting<boolean>('require_email_verification', false),
        allowRegistration: await getSetting<boolean>('allow_registration', true),
    };
};

/**
 * Get content configuration
 */
export const getContentConfig = async () => {
    return {
        commentsRequireApproval: await getSetting<boolean>('comments_require_approval', false),
        maxCommentLength: await getSetting<number>('max_comment_length', 1000),
    };
};

/**
 * Clear settings cache and force reload
 */
export const refreshSettings = async (): Promise<void> => {
    apiCache.delete(CACHE_KEY);
    apiCache.delete('app:settings:public');
    await loadSettings();
    console.log('[SettingsService] Settings refreshed');
};

export default {
    loadSettings,
    getSettings,
    getSetting,
    getSettingSync,
    updateSetting,
    getPublicSettings,
    isMaintenanceMode,
    isRegistrationAllowed,
    getEmailConfig,
    getSecurityConfig,
    getContentConfig,
    refreshSettings,
};
