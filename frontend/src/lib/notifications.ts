import type { NotificationItem } from '../services/notificationService';
import { consumeEventStream, type StreamOptions } from './eventStream.ts';
export function notificationTarget(target: string) {
  return typeof target === 'string' &&
    /^\/(movie\/|watch\/|profile(?:$|[?#])|admin\/reports(?:$|[?#])|notifications(?:$|[?#]))/.test(
      target,
    ) &&
    !/[\\\r\n]/.test(target)
    ? target
    : '/notifications';
}
export function notificationDirectTarget(
  item: NotificationItem,
): string | undefined {
  const target = notificationTarget(item.target);
  if (item.type === 'COMMENT_REPLY' && /^\/(movie|watch)\//.test(target))
    return target;
  if (
    item.type === 'ADMIN_REPORT' &&
    /^\/admin\/reports(?:$|[?#])/.test(target)
  )
    return target;
}
export function notificationRelatedQueries(
  item: NotificationItem,
): (string | number)[][] {
  if (item.type === 'ADMIN_REPORT') return [['admin', 'reports']];
  if (item.type !== 'COMMENT_REPLY') return [];
  const url = new URL(
    notificationTarget(item.target),
    'http://notification.local',
  );
  const id = /^#comment-([a-f\d]{24})$/i.exec(url.hash)?.[1];
  const numericId = /^\/(movie|watch)\/([1-9]\d*)(?:\/|$)/.exec(
    url.pathname,
  )?.[2];
  return [
    numericId ? ['comments', Number(numericId)] : ['comments'],
    ...(id
      ? [
          ['replies', id],
          ['comment-thread', id],
        ]
      : [['replies'], ['comment-thread']]),
  ];
}
export function notificationText(
  item: NotificationItem,
  t: (key: string, options?: any) => string,
) {
  const data = item.data || {};
  return {
    title: t(`notifications.types.${item.type}.title`),
    body: t(`notifications.types.${item.type}.body`, {
      actor: data.actorName || t('notifications.someone'),
      reason: data.reason || '',
      reportType: data.reportType
        ? t(`admin.reports.${data.reportType.toLowerCase()}`)
        : '',
    }),
  };
}
export interface NotificationMessage {
  type: 'ready' | 'change';
  kind?: 'created' | 'read';
  id?: string;
}
export function parseNotificationFrame(
  frame: string,
): NotificationMessage | undefined {
  const lines = frame.split('\n');
  const type = lines
    .find((line) => line.startsWith('event:'))
    ?.slice(6)
    .trim();
  if (type === 'ready') return { type: 'ready' };
  if (type !== 'change') return;
  try {
    const data = JSON.parse(
      lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n'),
    );
    if (data.kind === 'read') return { type, kind: 'read' };
    if (
      data.kind === 'created' &&
      typeof data.id === 'string' &&
      /^[a-f\d]{24}$/i.test(data.id)
    )
      return { type, kind: 'created', id: data.id };
  } catch {
    return;
  }
}
export const consumeNotificationStream = (
  options: StreamOptions<NotificationMessage>,
) => consumeEventStream({ ...options, parseFrame: parseNotificationFrame });
