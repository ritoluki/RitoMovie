import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import Report from '../../models/Report';
import { notifyReportOutcome } from '../../services/notificationService';
import Comment from '../../models/Comment';
import User from '../../models/User';
import Movie from '../../models/Movie';
import { logAdminAction } from '../../middleware/adminAuth';
import {
  ACTIVE_REPORT_STATUSES,
  isObjectId,
  parseReportResolution,
  REPORT_REASONS,
} from '../../utils/reportPolicy';

const statuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const requireId = (id: unknown) => {
  if (!isObjectId(id))
    throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
};
const findReport = async (id: string, actionable = false) => {
  requireId(id);
  const report = await Report.findById(id);
  if (!report) throw new ApiError(404, 'reports.notFound', 'REPORT_NOT_FOUND');
  if (actionable && !ACTIVE_REPORT_STATUSES.includes(report.status)) {
    throw new ApiError(409, 'reports.alreadyClosed', 'REPORT_ALREADY_CLOSED');
  }
  return report;
};

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const pageNumber = Number(req.query.page);
  const limitNumber = Number(req.query.limit);
  const page = Number.isFinite(pageNumber)
    ? Math.max(1, Math.floor(pageNumber) || 1)
    : 1;
  const limit = Number.isFinite(limitNumber)
    ? Math.min(100, Math.max(1, Math.floor(limitNumber) || 20))
    : 20;
  const query: Record<string, unknown> = {};
  for (const [key, options] of Object.entries({
    type: Object.keys(REPORT_REASONS),
    status: statuses,
    priority: priorities,
  })) {
    const value = req.query[key];
    if (!value) continue;
    if (typeof value !== 'string' || !options.includes(value))
      throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
    query[key] = value;
  }
  const sortBy = ['createdAt', 'updatedAt', 'priority', 'status'].includes(
    String(req.query.sortBy)
  )
    ? String(req.query.sortBy)
    : 'createdAt';
  const [reports, total, counts] = await Promise.all([
    Report.find(query)
      .populate('reporter', 'name email avatar')
      .populate('reviewedBy', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: req.query.sortOrder === 'asc' ? 1 : -1, _id: -1 }),
    Report.countDocuments(query),
    Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true,
    data: reports,
    statusCounts: Object.fromEntries(
      counts.map((item) => [item._id, item.count])
    ),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getReportDetails = asyncHandler(
  async (req: Request, res: Response) => {
    requireId(req.params.id);
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email avatar')
      .populate('reviewedBy', 'name email');
    if (!report)
      throw new ApiError(404, 'reports.notFound', 'REPORT_NOT_FOUND');
    let target = null;
    // PhimAPI slugs and TMDB IDs are external identifiers, not MongoDB ObjectIds.
    if (isObjectId(String(report.targetId))) {
      if (report.type === 'COMMENT')
        target = await Comment.findById(report.targetId)
          .populate('user', 'name avatar')
          .select('text movie user isDeleted isHidden');
      if (report.type === 'USER')
        target = await User.findById(report.targetId).select(
          'name email avatar role isBanned'
        );
      if (report.type === 'MOVIE')
        target = await Movie.findById(report.targetId).select('title tmdbId');
    }
    res.json({ success: true, data: { report, target } });
  }
);

export const updateReportStatus = asyncHandler(
  async (req: Request, res: Response) => {
    // Closing a report goes through resolve/reject so a moderation note is required.
    if (!ACTIVE_REPORT_STATUSES.includes(req.body.status))
      throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
    const report = await findReport(req.params.id, true);
    const oldStatus = report.status;
    report.status = req.body.status;
    report.reviewedBy = req.user._id;
    await report.save();
    await logAdminAction(req, 'UPDATE', 'REPORT', report.id, {
      oldStatus,
      newStatus: report.status,
    });
    res.json({ success: true, data: report });
  }
);

export const updateReportPriority = asyncHandler(
  async (req: Request, res: Response) => {
    if (!priorities.includes(req.body.priority))
      throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
    const report = await findReport(req.params.id, true);
    const oldPriority = report.priority;
    report.priority = req.body.priority;
    await report.save();
    await logAdminAction(req, 'UPDATE', 'REPORT', report.id, {
      oldPriority,
      newPriority: report.priority,
    });
    res.json({ success: true, data: report });
  }
);

export const resolveReport = asyncHandler(
  async (req: Request, res: Response) => {
    const resolution = parseReportResolution(req.body.resolution);
    const report = await findReport(req.params.id, true);
    const action = req.body.action || 'NONE';
    if (
      !['NONE', 'HIDE_COMMENT'].includes(action) ||
      (action === 'HIDE_COMMENT' && report.type !== 'COMMENT')
    ) {
      throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
    }
    if (action === 'HIDE_COMMENT') {
      const comment = await Comment.findOneAndUpdate(
        { _id: report.targetId, isDeleted: false },
        {
          isHidden: true,
          moderatedBy: req.user._id,
          moderatedAt: new Date(),
        }
      );
      if (!comment)
        throw new ApiError(
          404,
          'reports.targetMissing',
          'REPORT_TARGET_MISSING'
        );
      await logAdminAction(req, 'UPDATE', 'COMMENT', String(report.targetId), {
        isHidden: true,
        fromReport: report.id,
      });
    }
    report.status = 'RESOLVED';
    report.resolution = resolution;
    report.reviewedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();
    await notifyReportOutcome(report);
    await logAdminAction(req, 'UPDATE', 'REPORT', report.id, {
      resolution,
      actionTaken: action,
    });
    res.json({ success: true, data: report });
  }
);

export const rejectReport = asyncHandler(
  async (req: Request, res: Response) => {
    const reason = parseReportResolution(req.body.reason);
    const report = await findReport(req.params.id, true);
    report.status = 'REJECTED';
    report.resolution = reason;
    report.reviewedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();
    await notifyReportOutcome(report);
    await logAdminAction(req, 'UPDATE', 'REPORT', report.id, { reason });
    res.json({ success: true, data: report });
  }
);

export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, reportIds } = req.body;
  if (
    !['resolve', 'reject', 'set-reviewing'].includes(action) ||
    !Array.isArray(reportIds) ||
    !reportIds.length ||
    reportIds.length > 100 ||
    !reportIds.every(isObjectId)
  ) {
    throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
  }
  const reason =
    action === 'set-reviewing'
      ? undefined
      : parseReportResolution(req.body.reason);
  const status =
    action === 'resolve'
      ? 'RESOLVED'
      : action === 'reject'
        ? 'REJECTED'
        : 'REVIEWING';
  const resolvedAt = new Date();
  const result = await Report.updateMany(
    {
      _id: { $in: [...new Set(reportIds)] },
      status: {
        $in: action === 'set-reviewing' ? ['PENDING'] : ACTIVE_REPORT_STATUSES,
      },
    },
    {
      status,
      reviewedBy: req.user._id,
      ...(reason ? { resolution: reason, resolvedAt } : {}),
    },
    { runValidators: true }
  );
  if (reason && result.modifiedCount) {
    const changed = await Report.find({ _id: { $in: reportIds }, status, resolvedAt });
    for (const report of changed) await notifyReportOutcome(report);
  }
  await logAdminAction(req, 'UPDATE', 'REPORT', undefined, {
    bulkAction: action,
    reportIds,
    reason,
    modifiedCount: result.modifiedCount,
  });
  res.json({ success: true, modifiedCount: result.modifiedCount });
});
