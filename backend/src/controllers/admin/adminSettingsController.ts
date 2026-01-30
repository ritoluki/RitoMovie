import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import SystemSetting from '../../models/SystemSetting';
import { logAdminAction } from '../../middleware/adminAuth';

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
        if (typeof isSecret === 'boolean') setting.isSecret = isSecret;
        if (typeof isPublic === 'boolean') setting.isPublic = isPublic;
        setting.updatedBy = req.user?._id;

        await setting.save();

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
      errors.push({ key: item.key, error: (error as Error).message });
    }
  }

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
    { key: 'site_logo', value: '', category: 'general', description: 'Site logo URL', type: 'string', isPublic: true },
    { key: 'maintenance_mode', value: false, category: 'general', description: 'Enable maintenance mode', type: 'boolean', isPublic: true },
    
    // SEO
    { key: 'meta_title', value: 'RitoMovie - Stream Movies Online', category: 'seo', description: 'Default meta title', type: 'string', isPublic: true },
    { key: 'meta_description', value: 'Watch your favorite movies and TV shows online', category: 'seo', description: 'Default meta description', type: 'string', isPublic: true },
    { key: 'meta_keywords', value: 'movies, streaming, watch online', category: 'seo', description: 'Default meta keywords', type: 'string', isPublic: true },
    
    // Email
    { key: 'smtp_host', value: '', category: 'email', description: 'SMTP host', type: 'string', isSecret: false },
    { key: 'smtp_port', value: '587', category: 'email', description: 'SMTP port', type: 'string', isSecret: false },
    { key: 'smtp_user', value: '', category: 'email', description: 'SMTP username', type: 'string', isSecret: false },
    { key: 'smtp_password', value: '', category: 'email', description: 'SMTP password', type: 'string', isSecret: true },
    { key: 'email_from', value: 'noreply@ritomovie.com', category: 'email', description: 'From email address', type: 'string', isSecret: false },
    
    // Security
    { key: 'max_login_attempts', value: 5, category: 'security', description: 'Max login attempts before lockout', type: 'number', isPublic: false },
    { key: 'lockout_duration', value: 15, category: 'security', description: 'Lockout duration in minutes', type: 'number', isPublic: false },
    { key: 'require_email_verification', value: false, category: 'security', description: 'Require email verification for new users', type: 'boolean', isPublic: false },
    { key: 'allow_registration', value: true, category: 'security', description: 'Allow new user registration', type: 'boolean', isPublic: true },
    
    // Content
    { key: 'comments_require_approval', value: false, category: 'content', description: 'Require approval for comments', type: 'boolean', isPublic: false },
    { key: 'max_comment_length', value: 1000, category: 'content', description: 'Maximum comment length', type: 'number', isPublic: true },
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
