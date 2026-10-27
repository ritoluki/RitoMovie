import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { adminChanges, topicsForAdminRole } from '../../services/adminEvents';

const connections = new Map<string, Set<() => void>>();

export function streamAdminEvents(req: Request, res: Response) {
  const userId = String(req.user._id);
  const role = req.user.role as string;
  const allowed = new Set(topicsForAdminRole(role));
  const existing = connections.get(userId) || new Set<() => void>();
  if (existing.size >= 5) {
    res.setHeader('Retry-After', '30');
    res.status(429).json({ success: false, code: 'REALTIME_CONNECTION_LIMIT' });
    return;
  }
  // protect already verified the signature; decode only to bound the stream lifetime.
  const claims = jwt.decode(req.headers.authorization!.split(' ')[1]) as {
    exp?: number;
  };
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  let closed = false;
  let checking = false;
  let lastAuthCheck = Date.now();
  let heartbeat: ReturnType<typeof setInterval>;
  let unsubscribe = () => {};
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    unsubscribe();
    existing.delete(close);
    if (!existing.size) connections.delete(userId);
    if (!res.writableEnded) res.end();
  };
  const write = (frame: string) => {
    if (closed) return;
    if (res.destroyed || res.writableEnded || res.writableLength > 64 * 1024) {
      close();
      return;
    }
    try {
      res.write(frame);
    } catch {
      close();
    }
  };
  existing.add(close);
  connections.set(userId, existing);
  res.on('close', close);
  unsubscribe = adminChanges.subscribe((change) => {
    if (claims?.exp && claims.exp * 1000 <= Date.now()) {
      close();
      return;
    }
    const topics = change.topics.filter((topic) => allowed.has(topic));
    if (topics.length)
      write(`event: change\ndata: ${JSON.stringify({ topics })}\n\n`);
  });
  write(`event: ready\ndata: ${JSON.stringify({ topics: [...allowed] })}\n\n`);
  if (closed) return;
  heartbeat = setInterval(() => {
    if (claims?.exp && claims.exp * 1000 <= Date.now()) {
      close();
      return;
    }
    write(': heartbeat\n\n');
    // Revoke an existing stream after account bans/deletion/role changes, too.
    if (closed || checking || Date.now() - lastAuthCheck < 60_000) return;
    checking = true;
    lastAuthCheck = Date.now();
    User.findById(userId)
      .select('role isBanned')
      .then((user) => {
        if (!user || user.isBanned || user.role !== role) close();
      })
      .catch(close)
      .finally(() => {
        checking = false;
      });
  }, 20_000);
  heartbeat.unref();
}

export function closeAdminStreams() {
  for (const group of [...connections.values()])
    for (const close of [...group]) close();
}
