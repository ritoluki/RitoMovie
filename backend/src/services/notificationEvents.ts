export interface NotificationEvent {
  kind: 'created' | 'read';
  id?: string;
}
const subscribers = new Map<string, Set<(event: NotificationEvent) => void>>();
export const notificationEvents = {
  subscribe(userId: string, listener: (event: NotificationEvent) => void) {
    const group = subscribers.get(userId) || new Set();
    group.add(listener);
    subscribers.set(userId, group);
    return () => {
      group.delete(listener);
      if (!group.size) subscribers.delete(userId);
    };
  },
  publish(userId: string, event: NotificationEvent) {
    for (const listener of subscribers.get(userId) || []) {
      try {
        listener(event);
      } catch {
        /* A disconnected tab cannot fail a committed write. */
      }
    }
  },
};
