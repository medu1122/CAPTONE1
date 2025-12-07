import Notification from './notification.model.js';
import User from '../auth/auth.model.js';

/**
 * Create a notification
 * @param {object} data - Notification data
 * @param {string} data.userId - User to notify
 * @param {string} data.type - Type: 'reply', 'like', 'mention', 'comment'
 * @param {string} data.actorId - User who performed the action
 * @param {string} data.postId - Related post ID (optional)
 * @param {string} data.commentId - Related comment ID (optional)
 * @param {string} data.content - Content preview (optional)
 * @param {object} data.metadata - Additional metadata (optional)
 * @returns {Promise<object>} Created notification
 */
export const createNotification = async (data) => {
  try {
    const {
      userId,
      type,
      actorId,
      postId = null,
      commentId = null,
      content = null,
      metadata = {},
    } = data;

    // Don't notify if user is notifying themselves
    if (userId.toString() === actorId.toString()) {
      return null;
    }

    const notification = await Notification.create({
      user: userId,
      type,
      actor: actorId,
      post: postId,
      comment: commentId,
      content,
      metadata,
      read: false,
    });

    // Populate actor for response
    await notification.populate('actor', 'name profileImage');

    return notification;
  } catch (error) {
    console.error('❌ [Notification] Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.skip - Skip results
 * @param {boolean} options.unreadOnly - Only get unread notifications
 * @returns {Promise<object>} Notifications and count
 */
export const getNotifications = async (userId, options = {}) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = options;

    const query = { user: userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('actor', 'name profileImage')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return {
      notifications,
      total,
      unreadCount,
    };
  } catch (error) {
    console.error('❌ [Notification] Error getting notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security check)
 * @returns {Promise<object>} Updated notification
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    return notification;
  } catch (error) {
    console.error('❌ [Notification] Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('❌ [Notification] Error marking all as read:', error);
    throw error;
  }
};

/**
 * Extract mentions from text (@username)
 * @param {string} text - Text to extract mentions from
 * @returns {Promise<Array>} Array of user IDs mentioned
 */
export const extractMentions = async (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Match @username pattern (support Vietnamese characters and spaces)
    // Pattern: @ followed by username (letters, numbers, Vietnamese chars, spaces)
    const mentionPattern = /@([\w\s\u00C0-\u1EF9]+)/g;
    const matches = [...text.matchAll(mentionPattern)];
    
    if (!matches || matches.length === 0) {
      return [];
    }

    // Extract usernames (remove @ and trim)
    const usernames = matches.map(match => match[1].trim()).filter(Boolean);

    if (usernames.length === 0) {
      return [];
    }

    // Find users by name (case-insensitive, support partial match)
    // Try exact match first, then partial match
    const users = await User.find({
      $or: [
        { name: { $in: usernames.map(u => new RegExp(`^${u}$`, 'i')) } },
        { name: { $in: usernames.map(u => new RegExp(u, 'i')) } },
      ],
    }).select('_id name');

    return users.map(u => u._id);
  } catch (error) {
    console.error('❌ [Notification] Error extracting mentions:', error);
    return [];
  }
};

