import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Loader2,
  MessageCircle,
  Flag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  useNotificationCount,
  useNotificationList,
  useNotificationActions,
} from '@/hooks/useNotifications';
import { notificationText } from '@/lib/notifications';
import { useOpenNotification } from './NotificationOpenContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function NotificationFeed({
  onNavigate,
  fullPage = false,
}: {
  onNavigate?: () => void;
  fullPage?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [unread, setUnread] = useState(false);
  const query = useNotificationList(unread);
  const count = useNotificationCount();
  const actions = useNotificationActions();
  const openNotification = useOpenNotification();
  const items = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.data) || []).map((item) => [
        item._id,
        item,
      ]),
    ).values(),
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              onClick={() => setUnread(value)}
              aria-pressed={unread === value}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${unread === value ? 'bg-red-500/15 text-red-300' : 'text-gray-400 hover:bg-white/5'}`}
            >
              {t(value ? 'notifications.unread' : 'notifications.all')}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={actions.readAll.isPending || !count.data?.data.unreadCount}
          onClick={() => actions.readAll.mutate()}
        >
          <CheckCheck className="size-4" />
          <span className="text-xs">{t('notifications.readAll')}</span>
        </Button>
      </div>
      <div
        className={
          fullPage
            ? 'divide-y divide-white/[.06]'
            : 'max-h-[min(440px,65dvh)] divide-y divide-white/[.06] overflow-y-auto'
        }
      >
        {query.isLoading && (
          <div className="grid place-items-center p-8">
            <Loader2
              className="size-5 animate-spin"
              aria-label={t('common.loading')}
            />
          </div>
        )}
        {query.isError && (
          <div
            role="alert"
            className="space-y-3 p-6 text-center text-sm text-gray-400"
          >
            <p>{t('notifications.failed')}</p>
            <button className="underline" onClick={() => query.refetch()}>
              {t('common.retry')}
            </button>
          </div>
        )}
        {!query.isLoading && !query.isError && !items.length && (
          <div className="px-6 py-12 text-center">
            <Bell className="mx-auto mb-3 size-8 text-gray-600" />
            <p className="text-sm text-gray-400">
              {t(unread ? 'notifications.emptyUnread' : 'notifications.empty')}
            </p>
          </div>
        )}
        {items.map((item) => {
          const text = notificationText(item, t);
          const Icon =
            item.type === 'COMMENT_REPLY'
              ? MessageCircle
              : item.type.includes('REPORT')
                ? Flag
                : ShieldCheck;
          return (
            <button
              key={item._id}
              onClick={() => {
                if (onNavigate) {
                  onNavigate();
                  requestAnimationFrame(() => openNotification(item));
                } else openNotification(item);
              }}
              className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-white/[.06] disabled:opacity-60 ${!item.readAt ? 'bg-red-500/[.04]' : ''}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/5 text-red-300">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-100">
                  {text.title}
                  {!item.readAt && (
                    <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                  )}
                </span>
                <span className="block break-words text-sm leading-6 text-gray-400">
                  {text.body}
                </span>
                {item.data?.preview && (
                  <span className="mt-1 block line-clamp-2 break-words text-xs text-gray-500">
                    {item.data.preview}
                  </span>
                )}
                {item.type === 'COMMENT_RESTRICTED' && (
                  <span className="mt-1 block text-xs text-amber-300/80">
                    {item.data?.restrictionExpiresAt
                      ? t('notifications.until', {
                          date: new Date(
                            item.data.restrictionExpiresAt,
                          ).toLocaleString(i18n.language),
                        })
                      : t('notifications.untilLifted')}
                  </span>
                )}
                <time
                  dateTime={item.createdAt}
                  className="mt-2 block text-[11px] text-gray-500"
                >
                  {new Date(item.createdAt).toLocaleString(i18n.language)}
                </time>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-gray-500"
              />
            </button>
          );
        })}
        {query.hasNextPage && (
          <div className="p-3 text-center">
            <Button
              variant="ghost"
              disabled={query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
            >
              {t('notifications.loadMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const count = useNotificationCount();
  const { t } = useTranslation();
  const unread = count.data?.data.unreadCount || 0;
  if (!user) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('notifications.bellLabel', { count: unread })}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(400px,calc(100vw-1.5rem))] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="font-semibold">{t('notifications.title')}</h2>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-red-300 hover:underline"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
        <NotificationFeed onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
