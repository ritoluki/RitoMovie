import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import SystemSetting from '../../models/SystemSetting';
import { logAdminAction } from '../../middleware/adminAuth';
import settingsService from '../../services/settingsService';

/**
 * @desc    Get all settings
 * @route   GET /api/admin/settings
 * @access  Admin
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SystemSetting.find().sort('category key');

  // Group by category
  const groupedSettings = settings.reduce((acc: Record<string, typeof settings>, setting) => {
    const category = setting.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: groupedSettings,
  });
});

/**
 * @desc    Get settings by category
 * @route   GET /api/admin/settings/:category
 * @access  Admin
 */
export const getCategorySettings = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;

  const settings = await SystemSetting.find({ category }).sort('key');

  // Convert to key-value object
  const settingsObject = settings.reduce((acc: Record<string, unknown>, setting) => {
    // Mask secret values
    if (setting.isSecret) {
      acc[setting.key] = setting.value ? '********' : null;
    } else {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      category,
      settings: settingsObject,
      rawSettings: settings,
    },
  });
});

/**
 * @desc    Update settings
 * @route   PUT /api/admin/settings
 * @access  Super Admin
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;

  console.log('[Admin Settings Controller] Received settings update request:', {
    settingsCount: settings?.length,
    settingsKeys: settings?.map((s: any) => s.key)
  });

  if (!settings || !Array.isArray(settings)) {
    throw new ApiError(400, 'Settings array is required');
  }

  const updatedSettings = [];
  const errors = [];

  for (const item of settings) {
    try {
      const { key, value, category, description, type, isSecret, isPublic } = item;

      if (!key) {
        errors.push({ key, error: 'Key is required' });
        continue;
      }

      // Find or create setting
      let setting = await SystemSetting.findOne({ key });

      if (setting) {
        // Update existing
        const oldValue = setting.value;
        setting.value = value;
        if (description) setting.description = description;
        if (type) setting.type = type;
        if (category) setting.category = category; // Update category if provided
        if (typeof isSecret === 'boolean') setting.isSecret = isSecret;
        if (typeof isPublic === 'boolean') setting.isPublic = isPublic;
        setting.updatedBy = req.user?._id;

        await setting.save();

        console.log(`[Admin Settings Controller] Updated setting: ${key}`, {
          oldValue: setting.isSecret ? '[HIDDEN]' : oldValue,
          newValue: setting.isSecret ? '[HIDDEN]' : value
        });

        await logAdminAction(req, 'UPDATE', 'SETTING', setting._id.toString(), {
          key,
          oldValue: setting.isSecret ? '[HIDDEN]' : oldValue,
          newValue: setting.isSecret ? '[HIDDEN]' : value,
        });

        updatedSettings.push(setting);
      } else {
        // Create new
        setting = await SystemSetting.create({
          key,
          value,
          category: category || 'general',
          description: description || '',
          type: type || 'string',
          isSecret: isSecret || false,
          isPublic: isPublic || false,
          updatedBy: req.user?._id,
        });

        await logAdminAction(req, 'CREATE', 'SETTING', setting._id.toString(), {
          key,
          value: setting.isSecret ? '[HIDDEN]' : value,
        });

        updatedSettings.push(setting);
      }
    } catch (error) {
      console.error(`[Admin Settings Controller] Error updating setting ${item.key}:`, error);
      errors.push({ key: item.key, error: (error as Error).message });
    }
  }

  // Refresh settings cache so changes take effect immediately
  await settingsService.refreshSettings();

  res.status(200).json({
    success: true,
    data: {
      updated: updatedSettings.length,
      errors: errors.length > 0 ? errors : undefined,
      settings: updatedSettings,
    },
  });
});

/**
 * @desc    Delete a setting
 * @route   DELETE /api/admin/settings/:key
 * @access  Super Admin
 */
export const deleteSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;

  const setting = await SystemSetting.findOne({ key });

  if (!setting) {
    throw new ApiError(404, 'Setting not found');
  }

  await logAdminAction(req, 'DELETE', 'SETTING', setting._id.toString(), {
    key: setting.key,
    category: setting.category,
  });

  await SystemSetting.findByIdAndDelete(setting._id);

  res.status(200).json({
    success: true,
    message: 'Setting deleted successfully',
  });
});

/**
 * @desc    Test email settings
 * @route   POST /api/admin/settings/test-email
 * @access  Admin
 */
export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email address is required');
  }

  // Get email settings
  const smtpHost = await SystemSetting.findOne({ key: 'smtp_host' });
  const smtpPort = await SystemSetting.findOne({ key: 'smtp_port' });
  const smtpUser = await SystemSetting.findOne({ key: 'smtp_user' });
  const smtpPass = await SystemSetting.findOne({ key: 'smtp_password' });

  if (!smtpHost?.value || !smtpPort?.value) {
    throw new ApiError(400, 'Email settings are not configured');
  }

  // In a real implementation, you would send a test email here
  // For now, just simulate success
  await logAdminAction(req, 'TEST_EMAIL', 'SETTING', 'email', {
    testEmail: email,
  });

  res.status(200).json({
    success: true,
    message: `Test email would be sent to ${email} (email sending not implemented)`,
    config: {
      host: smtpHost.value,
      port: smtpPort.value,
      user: smtpUser?.value ? '***configured***' : 'not configured',
      password: smtpPass?.value ? '***configured***' : 'not configured',
    },
  });
});

/**
 * @desc    Get public settings (no auth required)
 * @route   GET /api/settings/public
 * @access  Public
 */
export const getPublicSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SystemSetting.find({ isPublic: true, isSecret: false });

  const publicSettings = settings.reduce((acc: Record<string, unknown>, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  console.log('[Admin Settings Controller] Public settings fetched:', {
    footer_copyright: publicSettings.footer_copyright,
    footer_text: publicSettings.footer_text,
    meta_title: publicSettings.meta_title,
    site_name: publicSettings.site_name,
    totalSettings: Object.keys(publicSettings).length
  });

  res.status(200).json({
    success: true,
    data: publicSettings,
  });
});

/**
 * @desc    Initialize default settings
 * @route   POST /api/admin/settings/initialize
 * @access  Super Admin
 */
export const initializeSettings = asyncHandler(async (req: Request, res: Response) => {
  const defaultSettings = [
    // General
    { key: 'site_name', value: 'RitoMovie', category: 'general', description: 'Site name', type: 'string', isPublic: true },
    { key: 'site_description', value: 'Your favorite movie streaming platform', category: 'general', description: 'Site description', type: 'string', isPublic: true },
    { key: 'site_logo_url', value: '', category: 'general', description: 'Site logo URL', type: 'string', isPublic: true },
    { key: 'site_favicon_url', value: '', category: 'general', description: 'Site favicon URL', type: 'string', isPublic: true },
    { key: 'contact_email', value: 'contact@ritomovie.live', category: 'general', description: 'Contact email', type: 'string', isPublic: true },
    { key: 'maintenance_mode', value: false, category: 'general', description: 'Enable maintenance mode', type: 'boolean', isPublic: true },
    { key: 'meta_title', value: 'RitoMovie - Watch Movies Online', category: 'general', description: 'SEO title', type: 'string', isPublic: true },
    { key: 'meta_description', value: 'Watch the latest movies and TV shows online for free', category: 'general', description: 'SEO description', type: 'string', isPublic: true },
    { key: 'meta_keywords', value: 'movies, tv shows, streaming, watch online', category: 'general', description: 'SEO keywords', type: 'string', isPublic: true },
    
    // Movie Settings
    { key: 'movies_per_page', value: 24, category: 'movie', description: 'Movies per page', type: 'number', isPublic: true },
    { key: 'default_video_quality', value: '1080p', category: 'movie', description: 'Default video quality', type: 'string', isPublic: true },
    { key: 'auto_play_trailer', value: true, category: 'movie', description: 'Auto play trailers', type: 'boolean', isPublic: true },
    { key: 'show_ads_before_movie', value: false, category: 'movie', description: 'Show ads before movies', type: 'boolean', isPublic: true },
    { key: 'enable_download', value: false, category: 'movie', description: 'Enable downloads', type: 'boolean', isPublic: true },
    { key: 'featured_movies_count', value: 10, category: 'movie', description: 'Featured movies count', type: 'number', isPublic: true },
    { key: 'trending_movies_count', value: 20, category: 'movie', description: 'Trending movies count', type: 'number', isPublic: true },
    
    // User Management
    { key: 'allow_registration', value: true, category: 'user', description: 'Allow user registration', type: 'boolean', isPublic: true },
    { key: 'require_email_verification', value: false, category: 'user', description: 'Require email verification', type: 'boolean', isPublic: false },
    { key: 'enable_comments', value: true, category: 'user', description: 'Enable comments', type: 'boolean', isPublic: true },
    { key: 'enable_ratings', value: true, category: 'user', description: 'Enable ratings', type: 'boolean', isPublic: true },
    { key: 'enable_watchlist', value: true, category: 'user', description: 'Enable watchlist', type: 'boolean', isPublic: true },
    { key: 'max_login_attempts', value: 5, category: 'user', description: 'Max login attempts', type: 'number', isPublic: false },
    { key: 'session_timeout_hours', value: 24, category: 'user', description: 'Session timeout hours', type: 'number', isPublic: false },
    
    // Appearance
    { key: 'primary_color', value: '#eab308', category: 'appearance', description: 'Primary color', type: 'string', isPublic: true },
    { key: 'secondary_color', value: '#dc2626', category: 'appearance', description: 'Secondary color', type: 'string', isPublic: true },
    { key: 'dark_mode_default', value: true, category: 'appearance', description: 'Dark mode default', type: 'boolean', isPublic: true },
    { key: 'show_movie_posters', value: true, category: 'appearance', description: 'Show movie posters', type: 'boolean', isPublic: true },
    { key: 'enable_animations', value: true, category: 'appearance', description: 'Enable animations', type: 'boolean', isPublic: true },
    { key: 'grid_layout_default', value: true, category: 'appearance', description: 'Grid layout default', type: 'boolean', isPublic: true },
    
    // Footer & Social
    { key: 'footer_text', value: 'Điểm đến yêu thích của bạn để xem những bộ phim và chương trình truyền hình hay nhất.', category: 'footer', description: 'Footer description text', type: 'string', isPublic: true },
    { key: 'footer_copyright', value: '© 2026 RitoMovie. Tất cả quyền được bảo lưu.', category: 'footer', description: 'Footer copyright text', type: 'string', isPublic: true },
    { key: 'footer_built_with_text', value: 'Được xây dựng với ❤️ bằng React, TypeScript & Node.js', category: 'footer', description: 'Footer built with text', type: 'string', isPublic: true },
    { key: 'social_facebook_url', value: '#', category: 'footer', description: 'Facebook URL', type: 'string', isPublic: true },
    { key: 'social_twitter_url', value: '#', category: 'footer', description: 'Twitter URL', type: 'string', isPublic: true },
    { key: 'social_instagram_url', value: '#', category: 'footer', description: 'Instagram URL', type: 'string', isPublic: true },
    { key: 'social_github_url', value: '#', category: 'footer', description: 'GitHub URL', type: 'string', isPublic: true },
    { key: 'show_vietnam_flag_message', value: true, category: 'footer', description: 'Show Vietnam flag message', type: 'boolean', isPublic: true },
    
    // API & Integration
    { key: 'tmdb_api_key', value: '', category: 'api', description: 'TMDB API key', type: 'string', isSecret: true },
    { key: 'google_analytics_id', value: '', category: 'api', description: 'Google Analytics ID', type: 'string', isPublic: true },
    { key: 'facebook_pixel_id', value: '', category: 'api', description: 'Facebook Pixel ID', type: 'string', isPublic: true },
    { key: 'enable_phim_api', value: true, category: 'api', description: 'Enable Phim API', type: 'boolean', isPublic: true },
    { key: 'api_rate_limit_per_minute', value: 60, category: 'api', description: 'API rate limit per minute', type: 'number', isPublic: false },
    
    // Email
    { key: 'smtp_host', value: '', category: 'email', description: 'SMTP host', type: 'string', isSecret: false },
    { key: 'smtp_port', value: 587, category: 'email', description: 'SMTP port', type: 'number', isSecret: false },
    { key: 'smtp_user', value: '', category: 'email', description: 'SMTP username', type: 'string', isSecret: false },
    { key: 'smtp_password', value: '', category: 'email', description: 'SMTP password', type: 'string', isSecret: true },
    { key: 'smtp_from_email', value: 'noreply@ritomovie.live', category: 'email', description: 'From email address', type: 'string', isSecret: false },
    { key: 'smtp_from_name', value: 'RitoMovie', category: 'email', description: 'From name', type: 'string', isSecret: false },
    { key: 'enable_newsletter', value: true, category: 'email', description: 'Enable newsletter', type: 'boolean', isPublic: true },
    
    // Performance
    { key: 'enable_cache', value: true, category: 'performance', description: 'Enable caching', type: 'boolean', isPublic: false },
    { key: 'cache_timeout_minutes', value: 15, category: 'performance', description: 'Cache timeout minutes', type: 'number', isPublic: false },
    { key: 'enable_lazy_loading', value: true, category: 'performance', description: 'Enable lazy loading', type: 'boolean', isPublic: true },
    { key: 'image_quality', value: 'medium', category: 'performance', description: 'Image quality', type: 'string', isPublic: true },
    { key: 'enable_service_worker', value: false, category: 'performance', description: 'Enable service worker', type: 'boolean', isPublic: true },
  ];

  let created = 0;
  let skipped = 0;

  for (const setting of defaultSettings) {
    const exists = await SystemSetting.findOne({ key: setting.key });
    if (!exists) {
      await SystemSetting.create({
        ...setting,
        updatedBy: req.user?._id,
      });
      created++;
    } else {
      skipped++;
    }
  }

  await logAdminAction(req, 'INITIALIZE_SETTINGS', 'SETTING', 'all', {
    created,
    skipped,
  });

  res.status(200).json({
    success: true,
    message: `Settings initialized. Created: ${created}, Skipped: ${skipped}`,
  });
});
