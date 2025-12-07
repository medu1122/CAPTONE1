import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, MessageSquare, Heart, AtSign, Bell } from 'lucide-react';
import { Notification } from '../services/notificationService';
import { getUserAvatar } from '../utils/avatar';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isLoading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.name || 'Ai đó';
    const postTitle = notification.metadata?.postTitle || notification.post?.title || 'bài viết';

    switch (notification.type) {
      case 'reply':
        return `${actorName} đã trả lời bình luận của bạn trong "${postTitle}"`;
      case 'like':
        return `${actorName} đã thích bài viết "${postTitle}" của bạn`;
      case 'mention':
        return `${actorName} đã nhắc đến bạn trong "${postTitle}"`;
      case 'comment':
        return `${actorName} đã bình luận trong bài viết "${postTitle}" của bạn`;
      default:
        return 'Bạn có thông báo mới';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }

    if (notification.post?._id) {
      navigate(`/community?post=${notification.post._id}`);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Actor Avatar */}
                    <img
                      src={getUserAvatar(notification.actor)}
                      alt={notification.actor?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm text-gray-900 dark:text-white flex-1">
                          {getNotificationText(notification)}
                        </p>
                      </div>
                      {notification.content && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                          {notification.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;

