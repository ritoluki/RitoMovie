import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { API_BASE_URL } from '@/utils/constants';
import {
  ADMIN_TOPICS,
  adminQueryKeys,
  type AdminTopic,
  type AdminRealtimeStatus,
} from '@/lib/adminRealtime';
import { createAdminRealtimeConnection } from '@/lib/adminRealtimeConnection';

export function useAdminRealtime(): AdminRealtimeStatus {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);
  const client = useQueryClient();
  const [status, setStatus] = useState<AdminRealtimeStatus>('connecting');
  useEffect(() => {
    if (
      !token ||
      !role ||
      !['super_admin', 'admin', 'moderator', 'analyst'].includes(role)
    )
      return;
    let stopped = false;
    let batchTimer: ReturnType<typeof setTimeout> | undefined;
    const pending = new Set<AdminTopic>();
    const visible = () =>
      document.visibilityState !== 'hidden' && navigator.onLine;
    const queue = (topics: readonly AdminTopic[]) => {
      topics.forEach((topic) => pending.add(topic));
      if (batchTimer) return;
      batchTimer = setTimeout(() => {
        batchTimer = undefined;
        if (stopped || !visible()) return;
        const changed = [...pending];
        pending.clear();
        for (const queryKey of adminQueryKeys(changed))
          void client.invalidateQueries({ queryKey, refetchType: 'active' });
        // This updates branding/settings in the current admin tab, preserving unsaved form fields.
        if (changed.includes('settings')) {
          void client.invalidateQueries({ queryKey: ['settings', 'public'] });
          void useSettingsStore.getState().fetchSettings(true);
        }
      }, 200);
    };
    const connection = createAdminRealtimeConnection({
      url: `${API_BASE_URL.replace(/\/+$/, '')}/admin/events`,
      token,
      onTopics: queue,
      onRefresh: () => queue(ADMIN_TOPICS),
      onStatus: setStatus,
    });
    const resume = () => {
      if (visible()) connection.resume();
      else connection.pause();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    window.addEventListener('focus', resume);
    resume();
    return () => {
      stopped = true;
      connection.stop();
      clearTimeout(batchTimer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
      window.removeEventListener('focus', resume);
    };
  }, [token, role, client]);
  return status;
}
