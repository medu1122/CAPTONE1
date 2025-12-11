import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, Notification } from '../services/notificationService';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationIcon: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const [notificationsData, unreadData] = await Promise.all([
          notificationService.getNotifications({ limit: 20, page: 1 }),
          notificationService.getUnreadCount(),
        ]);
        setNotifications(notificationsData.notifications);
        setUnreadCount(unreadData.unreadCount);
      } catch (error) {
        console.error('❌ [NotificationIcon] Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Setup SSE connection for realtime updates
    console.log('🔔 [NotificationIcon] Setting up SSE connection for user:', user?._id);
    const eventSource = notificationService.createSSEConnection(
      (notification) => {
        console.log('🔔 [NotificationIcon] Received notification:', notification);
        // Add new notification to the list
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      },
      (count) => {
        console.log('🔔 [NotificationIcon] Unread count updated:', count);
        setUnreadCount(count);
      },
      (error) => {
        console.error('❌ [NotificationIcon] SSE error:', error);
      }
    );

    eventSourceRef.current = eventSource;
    
    // Log connection state
    eventSource.addEventListener('open', () => {
      console.log('✅ [NotificationIcon] SSE connection opened');
    });
    
    eventSource.addEventListener('error', (e) => {
      console.error('❌ [NotificationIcon] SSE connection error:', e);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('🔌 [NotificationIcon] SSE connection closed');
      }
    });

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 [NotificationIcon] Closing SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      const refreshNotifications = async () => {
        try {
          const data = await notificationService.getNotifications({ limit: 20, page: 1 });
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        } catch (error) {
          console.error('❌ [NotificationIcon] Error refreshing notifications:', error);
        }
      };
      refreshNotifications();
    }
  }, [isOpen, isAuthenticated]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ [NotificationIcon] Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ [NotificationIcon] Error marking all as read:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
};

export default NotificationIcon;

