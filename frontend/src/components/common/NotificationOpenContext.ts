import { createContext, useContext } from 'react';
import type { NotificationItem } from '@/services/notificationService';
export const NotificationOpenContext = createContext<
  ((item: NotificationItem) => void) | null
>(null);
export function useOpenNotification() {
  const open = useContext(NotificationOpenContext);
  if (!open) throw new Error('NotificationCenterProvider is missing');
  return open;
}
