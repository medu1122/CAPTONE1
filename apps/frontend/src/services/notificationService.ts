import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { getAccessToken } from './authService';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Notification {
  _id: string;
  type: 'reply' | 'like' | 'mention' | 'comment';
  read: boolean;
  actor: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  post?: {
    _id: string;
    title: string;
  };
  comment?: string;
  content?: string;
  metadata?: {
    postTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export const notificationService = {
  /**
   * Get notifications
   */
  async getNotifications(options?: {
    limit?: number;
    page?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationResponse> {
    const { limit = 20, page = 1, unreadOnly = false } = options || {};
    const response = await api.get('/notifications', {
      params: { limit, page, unreadOnly },
    });
    return response.data.data;
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get('/notifications/unread-count');
    return response.data.data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ markedCount: number }> {
    const response = await api.patch('/notifications/read-all');
    return response.data.data;
  },

  /**
   * Create SSE connection for realtime notifications
   */
  createSSEConnection(
    onNotification: (notification: Notification) => void,
    onUnreadCount: (count: number) => void,
    onError?: (error: Event) => void
  ): EventSource {
    const token = getAccessToken();
    const url = `${API_BASE_URL}/notifications/stream`;
    
    const eventSource = new EventSource(url, {
      withCredentials: false,
    });

    // Note: EventSource doesn't support custom headers, so we'll need to pass token as query param
    // Or use a different approach. For now, let's use query param
    const eventSourceWithToken = new EventSource(
      `${url}?token=${token}`,
      { withCredentials: false }
    );

    eventSourceWithToken.addEventListener('connected', (event) => {
      console.log('🔔 [Notification SSE] Connected');
    });

    eventSourceWithToken.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('🔔 [Notification SSE] New notification:', notification);
        onNotification(notification);
      } catch (error) {
        console.error('❌ [Notification SSE] Error parsing notification:', error);
      }
    });

    eventSourceWithToken.addEventListener('unread-count', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🔔 [Notification SSE] Unread count:', data.unreadCount);
        onUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('❌ [Notification SSE] Error parsing unread count:', error);
      }
    });

    eventSourceWithToken.addEventListener('error', (event) => {
      console.error('❌ [Notification SSE] Error:', event);
      if (onError) {
        onError(event);
      }
    });

    return eventSourceWithToken;
  },
};

