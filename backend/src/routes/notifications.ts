import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  listNotifications,
  getUnreadCount,
  getNotification,
  markRead,
  markAllRead,
  streamNotifications,
} from '../controllers/notificationController';
const router = Router();
router.use(protect);
router.get('/events', streamNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.get('/', listNotifications);
router.get('/:id', getNotification);
router.put('/:id/read', markRead);
export default router;
