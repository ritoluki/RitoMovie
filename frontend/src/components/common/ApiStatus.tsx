import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { hasSlowApiRequests, subscribeToApiActivity } from '@/lib/apiActivity';

export default function ApiStatus() {
  const slow = useSyncExternalStore(subscribeToApiActivity, hasSlowApiRequests);
  const { i18n } = useTranslation();
  if (!slow) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-border bg-background/95 px-4 py-3 text-sm text-foreground shadow-lg"
    >
      {i18n.language.startsWith('vi')
        ? 'Máy chủ đang phản hồi chậm. Lần truy cập đầu sau thời gian nghỉ có thể mất khoảng một phút, bạn chờ một chút nhé.'
        : 'The server is taking longer to respond. The first visit after inactivity can take about a minute. Please wait.'}
    </div>
  );
}
