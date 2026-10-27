import {
  consumeAdminStream,
  type AdminTopic,
  type AdminRealtimeStatus,
} from './adminRealtime.ts';
import { createRealtimeConnection } from './realtimeConnection.ts';
export function createAdminRealtimeConnection({
  onTopics,
  consume = consumeAdminStream,
  ...options
}: {
  url: string;
  token: string;
  onTopics: (topics: readonly AdminTopic[]) => void;
  onRefresh: () => void;
  onStatus: (status: AdminRealtimeStatus) => void;
  consume?: typeof consumeAdminStream;
}) {
  return createRealtimeConnection({
    ...options,
    consume,
    onEvent: (event) => onTopics(event.topics),
  });
}
