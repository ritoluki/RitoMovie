import {
  consumeEventStream,
  StreamHttpError,
  type StreamOptions,
} from './eventStream.ts';
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
export type AdminRealtimeStatus =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'paused';
export interface AdminEvent {
  type: 'ready' | 'change';
  topics: AdminTopic[];
}

export function parseAdminEvent(frame: string): AdminEvent | undefined {
  const lines = frame.split('\n');
  const type = lines
    .find((line) => line.startsWith('event:'))
    ?.slice(6)
    .trim();
  if (type !== 'ready' && type !== 'change') return;
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  try {
    const input = JSON.parse(data);
    if (!Array.isArray(input?.topics)) return;
    const topics = [
      ...new Set(
        input.topics.filter(
          (topic: unknown) =>
            typeof topic === 'string' &&
            (ADMIN_TOPICS as readonly string[]).includes(topic),
        ),
      ),
    ] as AdminTopic[];
    return { type, topics };
  } catch {
    return;
  }
}

export function adminQueryKeys(topics: readonly AdminTopic[]): string[][] {
  const keys: string[][] = topics.map((topic) => ['admin', topic]);
  if (topics.includes('users')) keys.push(['admin', 'user']);
  return keys;
}

export { StreamHttpError as AdminStreamError };

export const consumeAdminStream = (options: StreamOptions<AdminEvent>) =>
  consumeEventStream({ ...options, parseFrame: parseAdminEvent });
