import { createElement, useEffect } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { notificationService } from '@/services/notificationService';
import {
  consumeNotificationStream,
  notificationRelatedQueries,
  notificationText,
} from '@/lib/notifications';
import { createRealtimeConnection } from '@/lib/realtimeConnection';
import { API_BASE_URL } from '@/utils/constants';
import { useOpenNotification } from '@/components/common/NotificationOpenContext';
import NotificationToast from '@/components/common/NotificationToast';

export function useNotificationCount() {
  const id = useAuthStore((state) => state.user?._id);
  return useQuery({
    queryKey: ['notifications', id, 'count'],
    queryFn: notificationService.count,
    enabled: !!id,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
export function useNotificationList(unread: boolean) {
  const id = useAuthStore((state) => state.user?._id);
  return useInfiniteQuery({
    queryKey: ['notifications', id, 'list', unread],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => notificationService.list(pageParam, unread),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
    enabled: !!id,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
export function useNotificationActions() {
  const client = useQueryClient();
  const id = useAuthStore((state) => state.user?._id);
  const { t } = useTranslation();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['notifications', id] });
  };
  const onError = () => toast.error(t('notifications.failed'));
  return {
    read: useMutation({
      mutationFn: notificationService.read,
      onSuccess: refresh,
      onError,
    }),
    readAll: useMutation({
      mutationFn: notificationService.readAll,
      onSuccess: refresh,
      onError,
    }),
  };
}

export function NotificationListener() {
  const userId = useAuthStore((state) => state.user?._id);
  const token = useAuthStore((state) => state.token);
  const client = useQueryClient();
  const openNotification = useOpenNotification();
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (!userId || !token) return;
    let stopped = false;
    const isCurrent = () =>
      !stopped &&
      useAuthStore.getState().user?._id === userId &&
      useAuthStore.getState().token === token;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const seen = new Set<string>();
    const refresh = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!stopped)
          void client.invalidateQueries({
            queryKey: ['notifications', userId],
          });
      }, 150);
    };
    const refreshAccount = () => {
      void authService
        .getMe()
        .then((user) => {
          if (isCurrent() && String(user._id) === userId)
            useAuthStore.getState().setUser(user);
        })
        .catch(() => {});
    };
    const connection = createRealtimeConnection({
      url: `${API_BASE_URL.replace(/\/+$/, '')}/notifications/events`,
      token,
      consume: consumeNotificationStream,
      onRefresh: refresh,
      onStatus: () => {},
      onEvent: (event) => {
        if (!isCurrent()) return;
        refresh();
        if (event.type === 'ready') {
          refreshAccount();
          return;
        }
        if (event.kind !== 'created' || !event.id || seen.has(event.id)) return;
        seen.add(event.id);
        if (seen.size > 200) seen.delete(seen.values().next().value!);
        void notificationService
          .get(event.id)
          .then(({ data }) => {
            if (!isCurrent()) return;
            const text = notificationText(data, t);
            for (const queryKey of notificationRelatedQueries(data))
              void client.invalidateQueries({
                queryKey,
                refetchType: 'active',
              });
            toast.custom(
              (id) =>
                createElement(NotificationToast, {
                  ...text,
                  label: t('notifications.open'),
                  onOpen: () => {
                    toast.dismiss(id);
                    openNotification(data);
                  },
                }),
              { duration: 6000 },
            );
            if (
              data.type === 'COMMENT_RESTRICTED' ||
              data.type === 'COMMENT_RESTRICTION_LIFTED'
            )
              refreshAccount();
          })
          .catch(() => {});
      },
    });
    const resume = () => {
      if (document.visibilityState !== 'hidden' && navigator.onLine)
        connection.resume();
      else connection.pause();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    window.addEventListener('focus', resume);
    resume();
    return () => {
      stopped = true;
      clearTimeout(timer);
      connection.stop();
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
      window.removeEventListener('focus', resume);
    };
  }, [userId, token, client, openNotification, t, i18n.language]);
  return null;
}
