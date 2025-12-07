import Notification from './notification.model.js';
import { verifyToken } from '../../common/utils/jwt.js';

// Store active SSE connections
const activeConnections = new Map();

/**
 * SSE endpoint for realtime notifications
 * Note: EventSource doesn't support custom headers, so we accept token as query param
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const streamNotifications = async (req, res) => {
  try {
    // Try to get user from req.user (if authenticate middleware worked)
    // Otherwise, try to get token from query param (for EventSource)
    let userId;
    
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else {
      // Try to get token from query param
      const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = verifyToken(token);
          userId = decoded.id;
        } catch (error) {
          console.error('❌ [Notification SSE] Invalid token:', error);
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
      } else {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });

    // Disable timeout for SSE
    res.setTimeout(0);

    // Send initial connection event
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);

    // Store connection
    activeConnections.set(userId, res);

    // Send initial unread count
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });
    res.write('event: unread-count\n');
    res.write(`data: ${JSON.stringify({ unreadCount })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      activeConnections.delete(userId);
      console.log(`🔌 [Notification SSE] Connection closed for user ${userId}`);
    });

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      if (activeConnections.has(userId)) {
        try {
          res.write(': heartbeat\n\n');
        } catch (error) {
          clearInterval(heartbeatInterval);
          activeConnections.delete(userId);
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Every 30 seconds

  } catch (error) {
    console.error('❌ [Notification SSE] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE initialization failed' });
    } else {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  }
};

/**
 * Broadcast notification to user
 * @param {string} userId - User ID to notify
 * @param {object} notification - Notification object
 */
export const broadcastNotification = async (userId, notification) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    try {
      // Populate notification before sending
      await notification.populate('actor', 'name profileImage');
      await notification.populate('post', 'title');

      connection.write('event: notification\n');
      connection.write(`data: ${JSON.stringify(notification.toObject())}\n\n`);

      // Update unread count
      const unreadCount = await Notification.countDocuments({
        user: userId,
        read: false,
      });
      connection.write('event: unread-count\n');
      connection.write(`data: ${JSON.stringify({ unreadCount })}\n\n`);
    } catch (error) {
      console.error('❌ [Notification SSE] Error broadcasting:', error);
    }
  }
};

/**
 * Close all connections for a user (on logout)
 * @param {string} userId - User ID
 */
export const closeUserConnections = (userId) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    try {
      connection.write('event: disconnect\n');
      connection.write(`data: ${JSON.stringify({ status: 'disconnected' })}\n\n`);
      connection.end();
    } catch (error) {
      console.error('❌ [Notification SSE] Error closing connection:', error);
    }
    activeConnections.delete(userId);
  }
};

