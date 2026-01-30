import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import AuditLog from '../../models/AuditLog';

/**
 * @desc    List audit logs with filters
 * @route   GET /api/admin/audit-logs
 * @access  Admin
 */
export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    admin,
    action,
    resource,
    dateFrom,
    dateTo,
    search,
  } = req.query;

  const query: Record<string, unknown> = {};

  // Filter by admin
  if (admin) {
    query.admin = admin;
  }

  // Filter by action
  if (action) {
    query.action = action;
  }

  // Filter by resource type
  if (resource) {
    query.resource = resource;
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      (query.createdAt as Record<string, Date>).$gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      (query.createdAt as Record<string, Date>).$lte = new Date(dateTo as string);
    }
  }

  // Search in details
  if (search) {
    query.$or = [
      { 'details.email': { $regex: search, $options: 'i' } },
      { 'details.name': { $regex: search, $options: 'i' } },
      { 'details.key': { $regex: search, $options: 'i' } },
      { resourceId: { $regex: search, $options: 'i' } },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('admin', 'name email avatar role')
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort('-createdAt'),
    AuditLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      page: +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / +limit),
    },
  });
});

/**
 * @desc    Get audit log details
 * @route   GET /api/admin/audit-logs/:id
 * @access  Admin
 */
export const getAuditLogDetails = asyncHandler(async (req: Request, res: Response) => {
  const log = await AuditLog.findById(req.params.id)
    .populate('admin', 'name email avatar role');

  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Audit log not found',
    });
  }

  res.status(200).json({
    success: true,
    data: log,
  });
});

/**
 * @desc    Get audit log statistics
 * @route   GET /api/admin/audit-logs/stats
 * @access  Admin
 */
export const getAuditLogStats = asyncHandler(async (req: Request, res: Response) => {
  const { period = '7d' } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Actions by type
  const actionsByType = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Resources affected
  const resourcesByType = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$resource',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Actions by admin
  const actionsByAdmin = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$admin',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'admin',
      },
    },
    { $unwind: { path: '$admin', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        count: 1,
        'admin.name': 1,
        'admin.email': 1,
        'admin.avatar': 1,
      },
    },
  ]);

  // Daily activity
  const dailyActivity = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Security events (failed logins, unauthorized access)
  const securityEvents = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        action: { $in: ['UNAUTHORIZED_ACCESS', 'LOGIN_FAILED', 'SECURITY_ALERT'] },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      actionsByType,
      resourcesByType,
      actionsByAdmin,
      dailyActivity,
      securityEvents,
    },
  });
});

/**
 * @desc    Export audit logs
 * @route   GET /api/admin/audit-logs/export
 * @access  Admin
 */
export const exportAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'json', dateFrom, dateTo, limit = 1000 } = req.query;

  const query: Record<string, unknown> = {};

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      (query.createdAt as Record<string, Date>).$gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      (query.createdAt as Record<string, Date>).$lte = new Date(dateTo as string);
    }
  }

  const logs = await AuditLog.find(query)
    .populate('admin', 'name email role')
    .limit(+limit)
    .sort('-createdAt');

  if (format === 'csv') {
    const csvRows = [
      ['Timestamp', 'Admin', 'Email', 'Action', 'Resource', 'Resource ID', 'IP Address', 'User Agent'],
    ];

    for (const log of logs) {
      const admin = log.admin as { name?: string; email?: string } | null;
      csvRows.push([
        log.createdAt.toISOString(),
        admin?.name || 'Unknown',
        admin?.email || 'Unknown',
        log.action,
        log.resource,
        log.resourceId || '',
        log.ipAddress || '',
        log.userAgent || '',
      ]);
    }

    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    );
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    data: logs,
  });
});

/**
 * @desc    Clear old audit logs
 * @route   DELETE /api/admin/audit-logs/clear
 * @access  Super Admin
 */
export const clearOldAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { olderThanDays = 90 } = req.body;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await AuditLog.deleteMany({
    createdAt: { $lt: cutoffDate },
  });

  // Log this action (will be in the new logs)
  await AuditLog.create({
    admin: req.user?._id,
    action: 'CLEAR_LOGS',
    resource: 'AUDIT_LOG',
    details: {
      olderThanDays,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: `Deleted ${result.deletedCount} audit logs older than ${olderThanDays} days`,
    deletedCount: result.deletedCount,
  });
});
