import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationActions } from '@/hooks/useNotifications';
import type { NotificationItem } from '@/services/notificationService';
import {
  notificationDirectTarget,
  notificationRelatedQueries,
  notificationTarget,
  notificationText,
} from '@/lib/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotificationOpenContext } from './NotificationOpenContext';

export default function NotificationCenterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const userId = useAuthStore((state) => state.user?._id);
  const [details, setDetails] = useState<{
    item: NotificationItem;
    owner: string;
  } | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { read } = useNotificationActions();
  useEffect(() => setDetails(null), [userId]);
  const open = useCallback(
    (item: NotificationItem) => {
      if (!userId || useAuthStore.getState().user?._id !== userId) return;
      if (!item.readAt) read.mutate(item._id);
      for (const queryKey of notificationRelatedQueries(item))
        void client.invalidateQueries({ queryKey, refetchType: 'active' });
      const target = notificationDirectTarget(item);
      if (target) {
        setDetails(null);
        // A new location key also reopens the thread when this is the current URL.
        navigate(target, {
          state: { notificationOpen: `${item._id}:${Date.now()}` },
        });
      } else setDetails({ item, owner: userId });
    },
    [userId, read.mutate, client, navigate],
  );
  const item = details && details.owner === userId ? details.item : undefined;
  const text = item ? notificationText(item, t) : undefined;
  const target = item ? notificationTarget(item.target) : '';
  const profileAction =
    item?.type === 'COMMENT_RESTRICTED' ||
    item?.type === 'COMMENT_RESTRICTION_LIFTED';
  const action = profileAction
    ? '/profile'
    : /^\/(movie|watch)\//.test(target)
      ? target
      : undefined;
  return (
    <NotificationOpenContext.Provider value={open}>
      {children}
      <Dialog
        open={!!item}
        onOpenChange={(value) => {
          if (!value) setDetails(null);
        }}
      >
        <DialogContent
          closeLabel={t('common.close')}
          className="max-h-[90dvh] overflow-y-auto"
        >
          <span className="mb-4 inline-flex rounded-xl bg-red-500/10 p-3 text-red-300">
            <Bell className="size-5" />
          </span>
          <DialogTitle className="pr-8">
            {text?.title || t('notifications.title')}
          </DialogTitle>
          <DialogDescription className="mt-3 whitespace-pre-wrap break-words">
            {text?.body}
          </DialogDescription>
          {item?.data?.preview && (
            <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-white/5 p-3 text-sm text-gray-300">
              {item.data.preview}
            </p>
          )}
          {item?.type === 'COMMENT_RESTRICTED' && (
            <p className="mt-4 text-sm text-amber-300">
              {item.data?.restrictionExpiresAt
                ? t('notifications.until', {
                    date: new Date(
                      item.data.restrictionExpiresAt,
                    ).toLocaleString(i18n.language),
                  })
                : t('notifications.untilLifted')}
            </p>
          )}
          {item && (
            <time
              dateTime={item.createdAt}
              className="mt-4 block text-xs text-gray-500"
            >
              {new Date(item.createdAt).toLocaleString(i18n.language)}
            </time>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setDetails(null)}>
              {t('common.close')}
            </Button>
            {action && (
              <Button
                onClick={() => {
                  setDetails(null);
                  navigate(action);
                }}
              >
                <ExternalLink className="size-4" />
                {t(
                  profileAction
                    ? 'notifications.viewAccount'
                    : 'notifications.viewContent',
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </NotificationOpenContext.Provider>
  );
}
