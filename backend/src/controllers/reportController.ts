import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import Report from '../models/Report';
import Comment from '../models/Comment';
import User from '../models/User';
import { notifyNewReport } from '../services/notificationService';
import {
  ACTIVE_REPORT_STATUSES,
  parseReportInput,
} from '../utils/reportPolicy';

const submitReport = async (req: Request, res: Response) => {
  const input = parseReportInput(req.body || {});
  if (input.type === 'COMMENT') {
    const comment = await Comment.findOne({
      _id: input.targetId,
      isDeleted: false,
      isHidden: false,
    }).populate('user', 'name');
    if (!comment)
      throw new ApiError(404, 'reports.targetMissing', 'REPORT_TARGET_MISSING');
    const author = comment.user as unknown as {
      _id: { toString(): string };
      name: string;
    };
    if (author?._id.toString() === req.user._id.toString())
      throw new ApiError(400, 'reports.selfReport', 'REPORT_SELF');
    input.context.commentId = comment.id;
    input.context.commentText = comment.text;
    input.context.authorName = author?.name;
    input.context.movieId = comment.movie;
  } else if (input.type === 'USER') {
    if (input.targetId === req.user._id.toString())
      throw new ApiError(400, 'reports.selfReport', 'REPORT_SELF');
    const user = await User.findById(input.targetId).select('name');
    if (!user)
      throw new ApiError(404, 'reports.targetMissing', 'REPORT_TARGET_MISSING');
    input.context.authorName = user.name;
    if (input.context.commentId) {
      const comment = await Comment.findOne({
        _id: input.context.commentId,
        user: input.targetId,
        isDeleted: false,
      });
      if (!comment)
        throw new ApiError(
          404,
          'reports.targetMissing',
          'REPORT_TARGET_MISSING'
        );
      input.context.commentText = comment.text;
      input.context.movieId = comment.movie;
    }
  }
  const reporter = req.user._id;
  if (
    await Report.exists({
      reporter,
      type: input.type,
      targetId: input.targetId,
      status: { $in: ACTIVE_REPORT_STATUSES },
    })
  ) {
    throw new ApiError(409, 'reports.duplicate', 'REPORT_DUPLICATE');
  }
  const now = Date.now();
  if (
    await Report.exists({
      reporter,
      createdAt: { $gt: new Date(now - 60_000) },
    })
  ) {
    res.setHeader('Retry-After', '60');
    throw new ApiError(429, 'reports.rateLimited', 'REPORT_RATE_LIMITED');
  }
  if (
    (await Report.countDocuments({
      reporter,
      createdAt: { $gt: new Date(now - 86_400_000) },
    })) >= 10
  ) {
    throw new ApiError(429, 'reports.dailyLimit', 'REPORT_DAILY_LIMIT');
  }
  try {
    const report = await Report.create({ ...input, reporter });
    await notifyNewReport(report);
    res.status(201).json({
      success: true,
      data: {
        _id: report._id,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new ApiError(409, 'reports.duplicate', 'REPORT_DUPLICATE');
    throw error;
  }
};

// Serialize simultaneous submissions from one account in this process. The database
// unique index additionally protects duplicate targets across server instances.
const submissions = new Set<string>();
export const createReport = asyncHandler(
  async (req: Request, res: Response) => {
    const key = req.user._id.toString();
    if (submissions.has(key)) {
      res.setHeader('Retry-After', '60');
      throw new ApiError(429, 'reports.rateLimited', 'REPORT_RATE_LIMITED');
    }
    submissions.add(key);
    try {
      await submitReport(req, res);
    } finally {
      submissions.delete(key);
    }
  }
);
