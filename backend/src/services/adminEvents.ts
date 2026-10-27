// Process-local events for the current single-process backend deployment. A shared
// pub/sub transport is needed if the backend is later scaled to multiple workers.
// Events contain cache topics only, never account details, tokens, or report contents.
export const ADMIN_TOPICS = [
  'reports',
  'comments',
  'users',
  'movies',
  'movie-source',
  'managed-movie-genres',
  'genres',
  'home-layout',
  'moderation-rules',
  'settings',
  'audit-logs',
  'dashboard',
  'analytics',
] as const;
export type AdminTopic = (typeof ADMIN_TOPICS)[number];
export interface AdminChange {
  topics: AdminTopic[];
}

const subscribers = new Set<(change: AdminChange) => void>();
export const adminChanges = {
  subscribe(listener: (change: AdminChange) => void) {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  },
  publish(topics: readonly AdminTopic[]) {
    const change = { topics: [...new Set(topics)] };
    if (!change.topics.length) return;
    for (const subscriber of subscribers) {
      // A disconnected receiver must not turn a successful database write into an API error.
      try {
        subscriber(change);
      } catch {
        subscribers.delete(subscriber);
      }
    }
  },
  get subscriberCount() {
    return subscribers.size;
  },
};

export function topicsForAdminRole(role: string): readonly AdminTopic[] {
  if (role === 'super_admin' || role === 'admin') return ADMIN_TOPICS;
  if (role === 'moderator')
    return ['reports', 'comments', 'moderation-rules', 'analytics'];
  if (role === 'analyst') return ['analytics'];
  return [];
}
