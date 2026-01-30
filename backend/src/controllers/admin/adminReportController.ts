import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import Report from '../../models/Report';
import { logAdminAction } from '../../middleware/adminAuth';

/**
 * @desc    List all reports with pagination and filters
 * @route   GET /api/admin/reports
 * @access  Admin
 */
export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    priority,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build query
  const query: Record<string, unknown> = {};

  if (type) {
    query.type = type;
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  // Build sort
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const reports = await Report.find(query)
    .populate('reporter', 'name email avatar')
    .populate('reviewedBy', 'name email')
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort(sort);

  const total = await Report.countDocuments(query);

  // Get counts by status
  const statusCounts = await Report.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    statusCounts: statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>),
    pagination: {
      page: +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / +limit),
    },
  });
});

/**
 * @desc    Get report details
 * @route   GET /api/admin/reports/:id
 * @access  Admin
 */
export const getReportDetails = asyncHandler(async (req: Request, res: Response) => {
  const report = await Report.findById(req.params.id)
    .populate('reporter', 'name email avatar')
    .populate('reviewedBy', 'name email');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Populate target based on type
  let target = null;
  if (report.type !== 'BUG' && report.targetModel) {
    const Model = require(`../../models/${report.targetModel}`).default;
    target = await Model.findById(report.targetId);
  }

  res.status(200).json({
    success: true,
    data: {
      report,
      target,
    },
  });
});

/**
 * @desc    Update report status
 * @route   PUT /api/admin/reports/:id/status
 * @access  Admin
 */
export const updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;

  const validStatuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const oldStatus = report.status;
  report.status = status;
  report.reviewedBy = req.user._id;

  if (status === 'RESOLVED' || status === 'REJECTED') {
    report.resolvedAt = new Date();
  }

  await report.save();

  await logAdminAction(req, 'UPDATE', 'COMMENT', report._id.toString(), {
    type: 'report_status_change',
    oldStatus,
    newStatus: status,
    reportType: report.type,
  });

  res.status(200).json({
    success: true,
    data: report,
    message: `Report status updated to ${status}`,
  });
});

/**
 * @desc    Update report priority
 * @route   PUT /api/admin/reports/:id/priority
 * @access  Admin
 */
export const updateReportPriority = asyncHandler(async (req: Request, res: Response) => {
  const { priority } = req.body;

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (!validPriorities.includes(priority)) {
    throw new ApiError(400, `Invalid priority. Valid priorities: ${validPriorities.join(', ')}`);
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const oldPriority = report.priority;
  report.priority = priority;
  await report.save();

  await logAdminAction(req, 'UPDATE', 'COMMENT', report._id.toString(), {
    type: 'report_priority_change',
    oldPriority,
    newPriority: priority,
  });

  res.status(200).json({
    success: true,
    data: report,
    message: `Report priority updated to ${priority}`,
  });
});

/**
 * @desc    Resolve report with action
 * @route   POST /api/admin/reports/:id/resolve
 * @access  Admin
 */
export const resolveReport = asyncHandler(async (req: Request, res: Response) => {
  const { resolution, action } = req.body;

  if (!resolution) {
    throw new ApiError(400, 'Resolution description is required');
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  report.status = 'RESOLVED';
  report.resolution = resolution;
  report.reviewedBy = req.user._id;
  report.resolvedAt = new Date();

  await report.save();

  // Take action on reported content if specified
  if (action) {
    // TODO: Implement actions like delete content, ban user, etc.
    await logAdminAction(req, 'UPDATE', report.type as any, report.targetId?.toString(), {
      actionTaken: action,
      fromReport: report._id,
    });
  }

  await logAdminAction(req, 'UPDATE', 'COMMENT', report._id.toString(), {
    type: 'report_resolved',
    resolution,
    actionTaken: action,
  });

  res.status(200).json({
    success: true,
    data: report,
    message: 'Report resolved successfully',
  });
});

/**
 * @desc    Reject report
 * @route   POST /api/admin/reports/:id/reject
 * @access  Admin
 */
export const rejectReport = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  report.status = 'REJECTED';
  report.resolution = reason;
  report.reviewedBy = req.user._id;
  report.resolvedAt = new Date();

  await report.save();

  await logAdminAction(req, 'UPDATE', 'COMMENT', report._id.toString(), {
    type: 'report_rejected',
    reason,
  });

  res.status(200).json({
    success: true,
    data: report,
    message: 'Report rejected',
  });
});

/**
 * @desc    Bulk action on reports
 * @route   POST /api/admin/reports/bulk-action
 * @access  Admin
 */
export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, reportIds, reason } = req.body;

  if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
    throw new ApiError(400, 'No reports selected');
  }

  const validActions = ['resolve', 'reject', 'set-reviewing'];
  if (!validActions.includes(action)) {
    throw new ApiError(400, `Invalid action. Valid actions: ${validActions.join(', ')}`);
  }

  let result;

  switch (action) {
    case 'resolve':
      result = await Report.updateMany(
        { _id: { $in: reportIds } },
        {
          status: 'RESOLVED',
          resolution: reason || 'Bulk resolved',
          reviewedBy: req.user._id,
          resolvedAt: new Date(),
        }
      );
      break;
    case 'reject':
      result = await Report.updateMany(
        { _id: { $in: reportIds } },
        {
          status: 'REJECTED',
          resolution: reason || 'Bulk rejected',
          reviewedBy: req.user._id,
          resolvedAt: new Date(),
        }
      );
      break;
    case 'set-reviewing':
      result = await Report.updateMany(
        { _id: { $in: reportIds } },
        {
          status: 'REVIEWING',
          reviewedBy: req.user._id,
        }
      );
      break;
  }

  await logAdminAction(req, 'UPDATE', 'COMMENT', undefined, {
    bulkAction: action,
    reportIds,
    reason,
    modifiedCount: result?.modifiedCount,
  });

  res.status(200).json({
    success: true,
    message: `Bulk ${action} completed`,
    modifiedCount: result?.modifiedCount,
  });
});
