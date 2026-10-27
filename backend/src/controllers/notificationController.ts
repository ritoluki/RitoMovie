import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Notification from '../models/Notification';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import { isObjectId } from '../utils/reportPolicy';
import { notificationEvents } from '../services/notificationEvents';

const filterFor = (req: Request) => ({
  recipient: req.user._id,
  ...(!['super_admin', 'admin', 'moderator'].includes(req.user.role)
    ? { type: { $ne: 'ADMIN_REPORT' } }
    : {}),
});
const select = '-recipient -dedupeKey -__v';
export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const number = Number(req.query.page);
    const page =
      Number.isSafeInteger(number) && number > 0 ? Math.min(number, 10000) : 1;
    const filter = {
      ...filterFor(req),
      ...(req.query.unread === 'true' ? { readAt: null } : {}),
    };
    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .select(select)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * 20)
        .limit(20),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filterFor(req), readAt: null }),
    ]);
    res.json({
      success: true,
      data: items,
      unreadCount,
      pagination: { page, pages: Math.ceil(total / 20), total },
    });
  }
);
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        unreadCount: await Notification.countDocuments({
          ...filterFor(req),
          readAt: null,
        }),
      },
    });
  }
);
export const getNotification = asyncHandler(
  async (req: Request, res: Response) => {
    if (!isObjectId(req.params.id))
      throw new ApiError(404, 'notifications.notFound');
    const item = await Notification.findOne({
      ...filterFor(req),
      _id: req.params.id,
    }).select(select);
    if (!item) throw new ApiError(404, 'notifications.notFound');
    res.json({ success: true, data: item });
  }
);
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  if (!isObjectId(req.params.id))
    throw new ApiError(404, 'notifications.notFound');
  let item = await Notification.findOneAndUpdate(
    { ...filterFor(req), _id: req.params.id, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  ).select(select);
  const changed = !!item;
  if (!item)
    item = await Notification.findOne({
      ...filterFor(req),
      _id: req.params.id,
    }).select(select);
  if (!item) throw new ApiError(404, 'notifications.notFound');
  if (changed)
    notificationEvents.publish(String(req.user._id), {
      kind: 'read',
      id: item.id,
    });
  res.json({ success: true, data: item });
});
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { ...filterFor(req), readAt: null },
    { readAt: new Date() }
  );
  notificationEvents.publish(String(req.user._id), { kind: 'read' });
  res.json({ success: true });
});

const connections = new Map<string, Set<() => void>>();
export function streamNotifications(req: Request, res: Response) {
  const userId = String(req.user._id);
  const group = connections.get(userId) || new Set<() => void>();
  if (group.size >= 5) {
    res.status(429).json({ success: false });
    return;
  }
  const claims = jwt.decode(req.headers.authorization!.split(' ')[1]) as {
    exp?: number;
  };
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  let closed = false;
  let lastAuth = Date.now();
  let heartbeat: ReturnType<typeof setInterval>;
  let checking = false;
  let unsubscribe = () => {};
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    unsubscribe();
    group.delete(close);
    if (!group.size) connections.delete(userId);
    if (!res.writableEnded) res.end();
  };
  const write = (frame: string) => {
    if (closed) return;
    if (
      res.destroyed ||
      res.writableEnded ||
      res.writableLength > 65536 ||
      (claims?.exp && claims.exp * 1000 <= Date.now())
    ) {
      close();
      return;
    }
    try {
      res.write(frame);
    } catch {
      close();
    }
  };
  group.add(close);
  connections.set(userId, group);
  res.on('close', close);
  unsubscribe = notificationEvents.subscribe(userId, (event) =>
    write(`event: change\ndata: ${JSON.stringify(event)}\n\n`)
  );
  write('event: ready\ndata: {}\n\n');
  if (closed) return;
  heartbeat = setInterval(() => {
    write(': heartbeat\n\n');
    if (closed || checking || Date.now() - lastAuth < 60000) return;
    lastAuth = Date.now();
    checking = true;
    User.findById(userId)
      .select('isBanned')
      .then((user) => {
        if (!user || user.isBanned) close();
      })
      .catch(close)
      .finally(() => {
        checking = false;
      });
  }, 20000);
  heartbeat.unref();
}
export function closeNotificationStreams() {
  for (const group of [...connections.values()])
    for (const close of [...group]) close();
}
