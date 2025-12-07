import express from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notification.controller.js';
import { streamNotifications } from './notification.stream.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

// SSE endpoint for realtime notifications (handles auth internally)
router.get('/stream', streamNotifications);

// All other routes require authentication
router.use(authMiddleware);

// Get notifications
router.get('/', getUserNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:id/read', markNotificationAsRead);

// Mark all as read
router.patch('/read-all', markAllNotificationsAsRead);

export default router;

