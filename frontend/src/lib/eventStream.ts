export interface StreamOptions<T> {
  url: string;
  token: string;
  signal: AbortSignal;
  onEvent: (event: T) => void;
  onActivity: () => void;
  request?: typeof fetch;
}
export class StreamHttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`Event stream returned ${status}`);
    this.status = status;
  }
}
export async function consumeEventStream<T>({
  url,
  token,
  signal,
  onEvent,
  onActivity,
  request = fetch,
  parseFrame,
}: StreamOptions<T> & { parseFrame: (frame: string) => T | undefined }) {
  const response = await request(url, {
    signal,
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    cache: 'no-store',
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new StreamHttpError(response.status);
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
        if (end > 65536) throw new Error('Admin event frame is too large');
        const event = parseFrame(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (event) onEvent(event);
      }
      if (buffer.length > 65536)
        throw new Error('Admin event frame is too large');
    }
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
