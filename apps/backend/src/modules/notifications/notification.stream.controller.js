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

    // Normalize userId to string for consistent key lookup
    const userIdStr = userId.toString();
    
    console.log(`✅ [Notification SSE] New connection for user ${userIdStr}`);
    console.log(`📊 [Notification SSE] Active connections: ${activeConnections.size}`);
    
    // Send initial connection event
    res.write('event: connected\n');
    res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: Date.now(), userId: userIdStr })}\n\n`);

    // Store connection
    activeConnections.set(userIdStr, res);
    console.log(`📊 [Notification SSE] Stored connection for user ${userIdStr}. Total: ${activeConnections.size}`);

    // Send initial unread count
    const unreadCount = await Notification.countDocuments({
      user: userIdStr,
      read: false,
    });
    res.write('event: unread-count\n');
    res.write(`data: ${JSON.stringify({ unreadCount })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      activeConnections.delete(userIdStr);
      console.log(`🔌 [Notification SSE] Connection closed for user ${userIdStr}. Remaining: ${activeConnections.size}`);
    });
    
    req.on('error', (error) => {
      console.error(`❌ [Notification SSE] Connection error for user ${userIdStr}:`, error);
      activeConnections.delete(userIdStr);
    });

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      if (activeConnections.has(userIdStr)) {
        try {
          res.write(': heartbeat\n\n');
        } catch (error) {
          clearInterval(heartbeatInterval);
          activeConnections.delete(userIdStr);
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
 * @param {string|ObjectId} userId - User ID to notify
 * @param {object} notification - Notification object
 */
export const broadcastNotification = async (userId, notification) => {
  try {
    // Normalize userId to string
    const userIdStr = userId.toString();
    
    const connection = activeConnections.get(userIdStr);
    if (connection) {
      try {
        // Ensure notification is populated
        // Check if actor needs population
        if (!notification.actor || 
            (typeof notification.actor === 'object' && !notification.actor.name)) {
          await notification.populate('actor', 'name profileImage');
        }
        
        // Check if post needs population
        if (notification.post && 
            (typeof notification.post === 'string' || 
             (typeof notification.post === 'object' && !notification.post.title))) {
          await notification.populate('post', 'title');
        }
        
        // Convert to plain object
        const notificationObj = notification.toObject ? notification.toObject() : notification;

        // Convert to plain object for JSON serialization
        const notificationData = {
          _id: notificationObj._id?.toString() || notificationObj._id,
          type: notificationObj.type,
          read: notificationObj.read || false,
          actor: {
            _id: notificationObj.actor?._id?.toString() || notificationObj.actor?._id || notificationObj.actor,
            name: notificationObj.actor?.name || 'Unknown',
            profileImage: notificationObj.actor?.profileImage || null,
          },
          post: notificationObj.post ? {
            _id: notificationObj.post._id?.toString() || notificationObj.post._id || notificationObj.post,
            title: notificationObj.post.title || notificationObj.metadata?.postTitle || 'Bài viết',
          } : null,
          comment: notificationObj.comment?.toString() || notificationObj.comment || null,
          content: notificationObj.content || null,
          metadata: notificationObj.metadata || {},
          createdAt: notificationObj.createdAt || new Date().toISOString(),
          updatedAt: notificationObj.updatedAt || new Date().toISOString(),
        };

        connection.write('event: notification\n');
        connection.write(`data: ${JSON.stringify(notificationData)}\n\n`);

        // Update unread count
        const unreadCount = await Notification.countDocuments({
          user: userIdStr,
          read: false,
        });
        connection.write('event: unread-count\n');
        connection.write(`data: ${JSON.stringify({ unreadCount })}\n\n`);
      } catch (error) {
        console.error('❌ [Notification SSE] Error broadcasting:', error);
      }
    } else {
      // Connection not found - notification will be fetched on next page load
      console.log(`⚠️ [Notification SSE] No active connection for user ${userIdStr}`);
    }
  } catch (error) {
    console.error('❌ [Notification SSE] Error in broadcastNotification:', error);
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

