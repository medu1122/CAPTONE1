import { httpSuccess, httpError } from '../../common/utils/http.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from './notification.service.js';

/**
 * Get notifications for current user
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const result = await getNotifications(req.user.id, {
      limit: parseInt(limit),
      skip,
      unreadOnly: unreadOnly === 'true',
    });

    const { statusCode, body } = httpSuccess(200, 'Notifications retrieved successfully', {
      notifications: result.notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit)),
      },
      unreadCount: result.unreadCount,
    });

    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await getNotifications(req.user.id, {
      limit: 1,
      skip: 0,
      unreadOnly: true,
    });

    const { statusCode, body } = httpSuccess(200, 'Unread count retrieved successfully', {
      unreadCount: result.unreadCount,
    });

    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await markAsRead(id, req.user.id);

    const { statusCode, body } = httpSuccess(200, 'Notification marked as read', notification);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.message === 'Notification not found or unauthorized') {
      return next(httpError(404, error.message));
    }
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const count = await markAllAsRead(req.user.id);

    const { statusCode, body } = httpSuccess(200, 'All notifications marked as read', {
      markedCount: count,
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

