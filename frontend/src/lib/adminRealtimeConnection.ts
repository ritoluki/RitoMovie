import {
  consumeAdminStream,
  AdminStreamError,
  type AdminTopic,
  type AdminRealtimeStatus,
} from './adminRealtime.ts';

// One connection per mounted admin layout. The React hook owns visibility events
// and query batching; this controller owns retry, heartbeat recovery and fallback.
export function createAdminRealtimeConnection({
  url,
  token,
  onTopics,
  onRefresh,
  onStatus,
  consume = consumeAdminStream,
}: {
  url: string;
  token: string;
  onTopics: (topics: readonly AdminTopic[]) => void;
  onRefresh: () => void;
  onStatus: (status: AdminRealtimeStatus) => void;
  consume?: typeof consumeAdminStream;
}) {
  let stopped = false;
  let active = false;
  let live = false;
  let forbidden = false;
  let connectedBefore = false;
  let failures = 0;
  let lastActivity = Date.now();
  let lastFallback = Date.now();
  let controller: AbortController | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const disconnect = () => {
    clearTimeout(retryTimer);
    const previous = controller;
    controller = undefined;
    previous?.abort();
    live = false;
  };
  const connect = async () => {
    if (stopped || forbidden || !active || controller) return;
    const connection = new AbortController();
    controller = connection;
    onStatus(connectedBefore || failures ? 'reconnecting' : 'connecting');
    const openingTimeout = setTimeout(() => connection.abort(), 15_000);
    try {
      await consume({
        url,
        token,
        signal: connection.signal,
        onActivity: () => {
          lastActivity = Date.now();
        },
        onEvent: (event) => {
          if (stopped || controller !== connection) return;
          clearTimeout(openingTimeout);
          connectedBefore = true;
          live = true;
          failures = 0;
          onStatus('live');
          onTopics(event.topics);
        },
      });
    } catch (error) {
      if (controller !== connection || stopped) return;
      if (
        error instanceof AdminStreamError &&
        [401, 403].includes(error.status)
      ) {
        forbidden = true;
        onRefresh();
      }
    } finally {
      clearTimeout(openingTimeout);
      if (controller !== connection) return;
      controller = undefined;
      live = false;
      if (stopped || !active) return;
      onStatus('reconnecting');
      if (!forbidden)
        retryTimer = setTimeout(
          connect,
          Math.min(30_000, 1000 * 2 ** Math.min(failures++, 5)),
        );
    }
  };
  const fallback = setInterval(() => {
    if (!active || stopped) return;
    if (live && Date.now() - lastActivity > 45_000) {
      disconnect();
      void connect();
    }
    if (!live && !forbidden && Date.now() - lastFallback >= 30_000) {
      lastFallback = Date.now();
      onRefresh();
    }
  }, 15_000);
  return {
    resume() {
      if (stopped) return;
      active = true;
      onRefresh();
      void connect();
    },
    pause() {
      if (stopped) return;
      active = false;
      disconnect();
      onStatus('paused');
    },
    stop() {
      stopped = true;
      active = false;
      disconnect();
      clearInterval(fallback);
    },
  };
}
