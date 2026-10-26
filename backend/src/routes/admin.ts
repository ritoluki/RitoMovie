import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  requireAdmin,
  requireAdminLevel,
  requireSuperAdmin,
  requireModerator,
  requireAnalyst,
  AdminRole,
} from '../middleware/adminAuth';

// Import admin controllers
import * as dashboardController from '../controllers/admin/adminDashboardController';
import * as userController from '../controllers/admin/adminUserController';
import * as movieController from '../controllers/admin/managedMovieController';
import * as homeLayoutController from '../controllers/admin/homeLayoutController';
import * as commentController from '../controllers/admin/adminCommentController';
import * as reportController from '../controllers/admin/adminReportController';
import * as analyticsController from '../controllers/admin/adminAnalyticsController';
import * as settingsController from '../controllers/admin/adminSettingsController';
import * as auditLogController from '../controllers/admin/adminAuditLogController';

const router = Router();

// All admin routes require authentication
router.use(protect);

// ==========================================
// Dashboard Routes (Admin level)
// ==========================================
router.get('/dashboard/stats', requireAdminLevel, dashboardController.getStats);
router.get('/dashboard/charts', requireAdminLevel, dashboardController.getCharts);
router.get('/dashboard/activity', requireAdminLevel, dashboardController.getActivity);
router.get('/dashboard/alerts', requireAdminLevel, dashboardController.getAlerts);

// ==========================================
// User Management Routes
// ==========================================
router.get('/users', requireAdminLevel, userController.listUsers);
router.get('/users/:id', requireAdminLevel, userController.getUserDetails);
router.get('/users/:id/activity', requireAdminLevel, userController.getUserActivity);
router.put('/users/:id', requireAdminLevel, userController.updateUser);
router.put('/users/:id/role', requireSuperAdmin, userController.changeUserRole); // Super admin only
router.put('/users/:id/ban', requireAdminLevel, userController.banUser);
router.put('/users/:id/unban', requireAdminLevel, userController.unbanUser);
router.put('/users/:id/comment-restriction', requireAdminLevel, validate([
  body('reason').trim().notEmpty().isLength({ max: 300 }),
  body('duration').isIn(['1h', '24h', '7d', '30d', 'permanent']),
]), userController.restrictUserComments);
router.delete('/users/:id/comment-restriction', requireAdminLevel, userController.liftUserCommentRestriction);
router.delete('/users/:id', requireSuperAdmin, userController.deleteUser); // Super admin only
router.post('/users/bulk-action', requireAdminLevel, userController.bulkAction);

// ==========================================
// Movie Management Routes
// ==========================================
router.get('/movies', requireAdminLevel, movieController.listMovies);
router.get('/home-layout', requireAdminLevel, homeLayoutController.getLayout);
router.put('/home-layout/order', requireAdminLevel, homeLayoutController.reorderSections);
router.post('/home-layout/reset', requireAdminLevel, homeLayoutController.resetLayout);
router.put('/home-layout/sections/:id', requireAdminLevel, homeLayoutController.updateSection);
router.post('/home-layout/sections/:id/visibility', requireAdminLevel, homeLayoutController.setGlobalVisibility);
router.get('/movies/source', requireAdminLevel, movieController.sourceMovies);
router.post('/movies/import-phim', requireAdminLevel, movieController.importMovie);
router.post('/movies/bulk-action', requireAdminLevel, movieController.bulkAction);
router.get('/movies/:id', requireAdminLevel, movieController.getMovie);
router.put('/movies/:id', requireAdminLevel, movieController.updateMovie);
router.delete('/movies/:id', requireAdminLevel, movieController.removeMovie);

// Genre management
router.get('/genres', requireAdminLevel, movieController.listGenres);

// ==========================================
// Comment Moderation Routes
// ==========================================
router.get('/comments', requireModerator, commentController.listComments);
router.put('/comments/:id', requireModerator, commentController.updateCommentStatus);
router.delete('/comments/:id', requireModerator, commentController.deleteComment);
router.post('/comments/bulk-action', requireModerator, commentController.bulkAction);

// Moderation rules (Admin level)
router.get('/moderation/rules', requireModerator, commentController.getModerationRules);
router.put('/moderation/rules', requireModerator, commentController.updateModerationRules);

// ==========================================
// Report Management Routes
// ==========================================
router.get('/reports', requireModerator, reportController.listReports);
router.get('/reports/:id', requireModerator, reportController.getReportDetails);
router.put('/reports/:id/status', requireModerator, reportController.updateReportStatus);
router.put('/reports/:id/priority', requireModerator, reportController.updateReportPriority);
router.post('/reports/:id/resolve', requireModerator, reportController.resolveReport);
router.post('/reports/:id/reject', requireModerator, reportController.rejectReport);
router.post('/reports/bulk-action', requireModerator, reportController.bulkAction);

// ==========================================
// Analytics Routes (Analyst level - read only)
// ==========================================
router.get('/analytics/traffic', requireAnalyst, analyticsController.getTrafficAnalytics);
router.get('/analytics/users', requireAnalyst, analyticsController.getUserAnalytics);
router.get('/analytics/content', requireAnalyst, analyticsController.getContentAnalytics);
router.get('/analytics/search-trends', requireAnalyst, analyticsController.getSearchTrends);
router.get('/analytics/export', requireAdminLevel, analyticsController.exportReport);

// ==========================================
// Settings Routes (Admin level)
// ==========================================
router.get('/settings', requireAdminLevel, settingsController.getSettings);
router.get('/settings/:category', requireAdminLevel, settingsController.getCategorySettings);
router.put('/settings', requireSuperAdmin, settingsController.updateSettings);
router.delete('/settings/:key', requireSuperAdmin, settingsController.deleteSetting);
router.post('/settings/test-email', requireAdminLevel, settingsController.testEmail);
router.post('/settings/initialize', requireSuperAdmin, settingsController.initializeSettings);

// ==========================================
// Audit Log Routes (Admin level)
// ==========================================
router.get('/audit-logs', requireAdminLevel, auditLogController.listAuditLogs);
router.get('/audit-logs/stats', requireAdminLevel, auditLogController.getAuditLogStats);
router.get('/audit-logs/export', requireAdminLevel, auditLogController.exportAuditLogs);
router.get('/audit-logs/:id', requireAdminLevel, auditLogController.getAuditLogDetails);
router.delete('/audit-logs/clear', requireSuperAdmin, auditLogController.clearOldAuditLogs);

// ==========================================
// Cache Management Routes (Super Admin only)
// ==========================================
import cacheService from '../services/cacheService';
import asyncHandler from '../utils/asyncHandler';

// Get cache statistics
router.get('/cache/stats', requireSuperAdmin, asyncHandler(async (_req, res) => {
    const stats = cacheService.getCacheStats();
    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
    });
}));

// Warm up cache
router.post('/cache/warm', requireSuperAdmin, asyncHandler(async (_req, res) => {
    const result = await cacheService.warmHomeCache(['en', 'vi']);
    res.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
    });
}));

// Clear all caches
router.delete('/cache/clear', requireSuperAdmin, asyncHandler(async (_req, res) => {
    cacheService.clearAllCaches();
    res.json({
        success: true,
        message: 'All caches cleared',
        timestamp: new Date().toISOString(),
    });
}));

// Clear cache by pattern
router.delete('/cache/clear/:pattern', requireSuperAdmin, asyncHandler(async (req, res) => {
    const { pattern } = req.params;
    const deleted = cacheService.clearCachePattern(pattern);
    res.json({
        success: true,
        message: `Cleared ${deleted} cache keys matching pattern: ${pattern}`,
        timestamp: new Date().toISOString(),
    });
}));

export default router;
