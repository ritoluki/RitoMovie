import api from '@/lib/axios';
export type NotificationType =
  | 'COMMENT_REPLY'
  | 'COMMENT_RESTRICTED'
  | 'COMMENT_RESTRICTION_LIFTED'
  | 'REPORT_RESOLVED'
  | 'REPORT_REJECTED'
  | 'ADMIN_REPORT';
export interface NotificationItem {
  _id: string;
  type: NotificationType;
  target: string;
  readAt: string | null;
  createdAt: string;
  data?: {
    actorName?: string;
    preview?: string;
    reason?: string;
    restrictionExpiresAt?: string;
    reportType?: string;
  };
}
export interface NotificationPage {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  pagination: { page: number; pages: number; total: number };
}
export const notificationService = {
  list: (page: number, unread: boolean) =>
    api.get<NotificationPage>('/notifications', { params: { page, unread } }),
  count: () =>
    api.get<{ success: boolean; data: { unreadCount: number } }>(
      '/notifications/unread-count',
    ),
  get: (id: string) =>
    api.get<{ success: boolean; data: NotificationItem }>(
      `/notifications/${id}`,
    ),
  read: (id: string) => api.put(`/notifications/${id}/read`),
  readAll: () => api.put('/notifications/read-all'),
};
