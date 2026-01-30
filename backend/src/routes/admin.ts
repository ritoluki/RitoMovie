import { Router } from 'express';
import { protect } from '../middleware/auth';
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
import * as movieController from '../controllers/admin/adminMovieController';
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
router.delete('/users/:id', requireSuperAdmin, userController.deleteUser); // Super admin only
router.post('/users/bulk-action', requireAdminLevel, userController.bulkAction);

// ==========================================
// Movie Management Routes
// ==========================================
router.get('/movies', requireAdminLevel, movieController.listMovies);
router.post('/movies', requireAdminLevel, movieController.createMovie);
router.get('/movies/:id', requireAdminLevel, movieController.getMovieDetails);
router.put('/movies/:id', requireAdminLevel, movieController.updateMovie);
router.delete('/movies/:id', requireAdminLevel, movieController.deleteMovie);
router.post('/movies/:id/feature', requireAdminLevel, movieController.setFeatured);
router.post('/movies/:id/trending', requireAdminLevel, movieController.setTrending);
router.post('/movies/import-tmdb', requireAdminLevel, movieController.importFromTMDB);
router.post('/movies/bulk-action', requireAdminLevel, movieController.bulkAction);

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
router.get('/moderation/rules', requireAdminLevel, commentController.getModerationRules);
router.put('/moderation/rules', requireAdminLevel, commentController.updateModerationRules);

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

export default router;
