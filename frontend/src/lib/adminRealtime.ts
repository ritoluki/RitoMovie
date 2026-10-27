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

export class AdminStreamError extends Error {
  status: number;
  constructor(status: number) {
    super(`Admin event stream returned ${status}`);
    this.status = status;
  }
}

// fetch supports the existing Bearer header without putting a token in a URL.
// Keep this request out of the normal request-duration spinner: it is intentionally long-lived.
export async function consumeAdminStream({
  url,
  token,
  signal,
  onEvent,
  onActivity,
  request = fetch,
}: {
  url: string;
  token: string;
  signal: AbortSignal;
  onEvent: (event: AdminEvent) => void;
  onActivity: () => void;
  request?: typeof fetch;
}) {
  const response = await request(url, {
    signal,
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    cache: 'no-store',
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new AdminStreamError(response.status);
  }
  if (
    !response.body ||
    !response.headers.get('content-type')?.includes('text/event-stream')
  ) {
    await response.body?.cancel();
    throw new Error('Invalid admin event stream');
  }
  const reader = response.body.getReader();
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', abort, { once: true });
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      onActivity();
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(
        /\r\n/g,
        '\n',
      );
      let end: number;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        if (end > 64 * 1024) throw new Error('Admin event frame is too large');
        const event = parseAdminEvent(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (event) onEvent(event);
      }
      if (buffer.length > 64 * 1024)
        throw new Error('Admin event frame is too large');
    }
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
