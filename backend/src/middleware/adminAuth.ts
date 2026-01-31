import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

// Levels of admin access
export enum AdminRole {
  SUPER_ADMIN = 'super_admin', // Full access
  ADMIN = 'admin', // Standard admin
  MODERATOR = 'moderator', // Content moderation only
  ANALYST = 'analyst', // View-only analytics
}

// All valid admin roles for validation
const VALID_ADMIN_ROLES = Object.values(AdminRole);

/**
 * Middleware to require admin access with specific roles
 * @param allowedRoles - Array of AdminRole values that can access the route
 */
export const requireAdmin = (
  allowedRoles: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN]
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!req.user) {
      // Log unauthorized access attempt
      await AuditLog.create({
        action: 'UNAUTHORIZED_ACCESS',
        resource: 'ADMIN_PANEL',
        details: {
          message: 'Access attempt without authentication',
          path: req.path,
        },
        ipAddress,
        userAgent,
      });

      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to access admin panel.',
      });
      return;
    }

    // Validate that user role is a valid AdminRole
    if (!VALID_ADMIN_ROLES.includes(req.user.role as AdminRole)) {
      await AuditLog.create({
        admin: req.user._id,
        action: 'INSUFFICIENT_PERMISSIONS',
        resource: 'ADMIN_PANEL',
        details: {
          message: `Invalid role: ${req.user.role}`,
          requiredRoles: allowedRoles,
          path: req.path,
        },
        ipAddress,
        userAgent,
      });

      res.status(403).json({
        success: false,
        message: `Access denied. Your role '${req.user.role}' is not authorized. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as AdminRole)) {
      await AuditLog.create({
        admin: req.user._id,
        action: 'INSUFFICIENT_PERMISSIONS',
        resource: 'ADMIN_PANEL',
        details: {
          message: `Role ${req.user.role} attempted to access restricted resource`,
          requiredRoles: allowedRoles,
          path: req.path,
        },
        ipAddress,
        userAgent,
      });

      res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require super admin access only
 */
export const requireSuperAdmin = requireAdmin([AdminRole.SUPER_ADMIN]);

/**
 * Middleware to require at least admin level access
 */
export const requireAdminLevel = requireAdmin([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]);

/**
 * Middleware to require at least moderator level access
 */
export const requireModerator = requireAdmin([
  AdminRole.SUPER_ADMIN,
  AdminRole.ADMIN,
  AdminRole.MODERATOR,
]);

/**
 * Middleware to require at least analyst level access (read-only)
 */
export const requireAnalyst = requireAdmin([
  AdminRole.SUPER_ADMIN,
  AdminRole.ADMIN,
  AdminRole.MODERATOR,
  AdminRole.ANALYST,
]);

/**
 * Helper to log admin actions
 */
export const logAdminAction = async (
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  await AuditLog.create({
    admin: req.user?._id,
    action,
    resource,
    resourceId,
    details: details || {},
    ipAddress,
    userAgent,
  });
};
