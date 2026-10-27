import api from '@/lib/axios';

export type ReportType = 'COMMENT' | 'USER' | 'MOVIE' | 'BUG';
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'SPOILER'
  | 'COPYRIGHT'
  | 'BUG_REPORT'
  | 'OTHER'
  | 'PLAYBACK_ERROR'
  | 'WRONG_CONTENT'
  | 'SUBTITLE_ERROR';
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
export interface ReportTarget {
  type: ReportType;
  targetId: string;
  label?: string;
  authorId?: string;
  context?: ReportContext;
}
export const reportReasons: Record<ReportType, ReportReason[]> = {
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
};

export const createReport = (data: {
  type: ReportType;
  targetId: string;
  reason: ReportReason;
  description: string;
  context: ReportContext;
}) =>
  api.post<{
    success: boolean;
    data: { _id: string; status: string; createdAt: string };
  }>('/reports', data);
