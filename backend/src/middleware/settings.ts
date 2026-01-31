/**
 * Settings Middleware
 * 
 * Middleware to apply system settings to requests
 */

import { Request, Response, NextFunction } from 'express';
import settingsService from '../services/settingsService';

/**
 * Check if site is in maintenance mode
 * Allows admin users to bypass maintenance mode
 */
export const checkMaintenanceMode = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Skip maintenance check for admin routes and auth routes
    if (
        req.path.startsWith('/api/admin') ||
        req.path.startsWith('/api/auth') ||
        req.path === '/health' ||
        req.path === '/api'
    ) {
        return next();
    }

    const isMaintenanceMode = settingsService.isMaintenanceMode();

    if (isMaintenanceMode) {
        // Check if user is admin (bypass maintenance)
        const user = (req as { user?: { role?: string } }).user;
        const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

        if (!isAdmin) {
            return res.status(503).json({
                success: false,
                message: 'Site is currently under maintenance. Please try again later.',
                maintenance: true,
            });
        }
    }

    next();
};

/**
 * Attach public settings to request for use in controllers
 */
export const attachSettings = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const settings = await settingsService.getSettings();
        (req as { appSettings?: typeof settings }).appSettings = settings;
    } catch (error) {
        console.error('[SettingsMiddleware] Error attaching settings:', error);
    }

    next();
};

/**
 * Check if registration is allowed
 */
export const checkRegistrationAllowed = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    const isAllowed = settingsService.isRegistrationAllowed();

    if (!isAllowed) {
        return res.status(403).json({
            success: false,
            message: 'Registration is currently disabled.',
        });
    }

    next();
};

export default {
    checkMaintenanceMode,
    attachSettings,
    checkRegistrationAllowed,
};
