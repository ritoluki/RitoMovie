import ApiError from './ApiError';

export const REPORT_REASONS = {
  COMMENT: ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'SPOILER', 'OTHER'],
  USER: ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER'],
  MOVIE: [
    'PLAYBACK_ERROR',
    'WRONG_CONTENT',
    'SUBTITLE_ERROR',
    'COPYRIGHT',
    'OTHER',
  ],
  BUG: ['BUG_REPORT', 'OTHER'],
} as const;
export type ReportType = keyof typeof REPORT_REASONS;
export type ReportReason = (typeof REPORT_REASONS)[ReportType][number];
export const ACTIVE_REPORT_STATUSES = ['PENDING', 'REVIEWING'];
export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

export interface ReportContext {
  movieId?: number;
  mediaType?: 'movie' | 'tv';
  movieSlug?: string;
  movieTitle?: string;
  episode?: string;
  server?: string;
  pagePath?: string;
  commentId?: string;
  commentText?: string;
  authorName?: string;
}

export const isReportPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 500 &&
  /^\/(?:movie\/|watch\/|$)/.test(value) &&
  !/[\\\r\n]/.test(value);

export function parseReportInput(input: Record<string, unknown>) {
  const { type, targetId, reason, description } = input;
  if (
    typeof type !== 'string' ||
    !Object.prototype.hasOwnProperty.call(REPORT_REASONS, type) ||
    typeof targetId !== 'string' ||
    typeof reason !== 'string' ||
    !(REPORT_REASONS[type as ReportType] as readonly string[]).includes(
      reason
    ) ||
    typeof description !== 'string' ||
    description.trim().length < 10 ||
    description.trim().length > 1000
  ) {
    throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
  }
  if ((type === 'COMMENT' || type === 'USER') && !isObjectId(targetId)) {
    throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
  }
  if (
    type === 'MOVIE' &&
    !/^(phim:[a-z0-9]+(?:-[a-z0-9]+)*|tmdb:(movie|tv):[1-9]\d{0,12})$/.test(
      targetId
    )
  ) {
    throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
  }
  if (targetId.length > 250 || (type === 'BUG' && !isReportPath(targetId))) {
    throw new ApiError(400, 'reports.invalid', 'REPORT_INVALID');
  }
  // Only store useful context. Never persist arbitrary request bodies or playback URLs/tokens.
  const raw =
    input.context &&
    typeof input.context === 'object' &&
    !Array.isArray(input.context)
      ? (input.context as Record<string, unknown>)
      : {};
  const context: ReportContext = {};
  for (const key of ['movieSlug', 'movieTitle', 'episode', 'server'] as const) {
    if (typeof raw[key] === 'string')
      context[key] = (raw[key] as string).trim().slice(0, 200);
  }
  if (
    typeof raw.movieId === 'number' &&
    Number.isSafeInteger(raw.movieId) &&
    raw.movieId > 0
  )
    context.movieId = raw.movieId;
  if (raw.mediaType === 'movie' || raw.mediaType === 'tv')
    context.mediaType = raw.mediaType;
  if (isReportPath(raw.pagePath)) context.pagePath = raw.pagePath;
  if (isObjectId(raw.commentId)) context.commentId = raw.commentId;
  return {
    type: type as ReportType,
    targetId,
    reason: reason as ReportReason,
    description: description.trim(),
    context,
  };
}

export function parseReportResolution(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.trim().length < 5 ||
    value.trim().length > 500
  ) {
    throw new ApiError(400, 'reports.resolutionRequired', 'REPORT_INVALID');
  }
  return value.trim();
}
