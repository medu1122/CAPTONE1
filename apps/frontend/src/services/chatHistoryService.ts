import { API_CONFIG } from '../config/api';

// Backend message format
export interface HistoryMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  message: string;
  messageType: 'text' | 'image' | 'image-text';
  analysis?: {
    _id: string;
    resultTop: {
      plant: {
        commonName: string;
        scientificName: string;
      };
      confidence: number;
    };
  } | null;
  createdAt: string;
}

// Backend session list format
export interface BackendSession {
  sessionId: string;
  lastMessageAt: string;
  messagesCount: number;
  firstMessage?: string;
}

interface LoadHistoryResponse {
  messages: HistoryMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface LoadSessionsResponse {
  sessions: BackendSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ChatHistoryService {
  private static instance: ChatHistoryService;

  private constructor() {}

  public static getInstance(): ChatHistoryService {
    if (!ChatHistoryService.instance) {
      ChatHistoryService.instance = new ChatHistoryService();
    }
    return ChatHistoryService.instance;
  }

  /**
   * Load chat history for a specific session
   */
  async loadHistory(sessionId: string, limit: number = 20, page: number = 1): Promise<HistoryMessage[]> {
    try {
      console.log('📜 Loading chat history for session:', sessionId);

      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available (optional for guest users)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat/history?sessionId=${sessionId}&limit=${limit}&page=${page}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Failed to load history:', response.status);
        return [];
      }

      const data: LoadHistoryResponse = await response.json();
      console.log('✅ History loaded:', data.messages?.length || 0, 'messages');
      return data.messages || [];
    } catch (error) {
      console.error('❌ Error loading history:', error);
      return [];
    }
  }

  /**
   * Load all sessions for current user
   */
  async loadSessions(limit: number = 50, page: number = 1): Promise<BackendSession[]> {
    try {
      console.log('📋 Loading sessions from backend...');

      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat/sessions?limit=${limit}&page=${page}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Failed to load sessions:', response.status);
        return [];
      }

      const data: { data: LoadSessionsResponse } = await response.json();
      console.log('✅ Sessions loaded:', data.data?.sessions?.length || 0);
      return data.data?.sessions || [];
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Clear history for a session
   */
  async clearHistory(sessionId: string): Promise<boolean> {
    try {
      console.log('🗑️ Clearing history for session:', sessionId);

      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat/history?sessionId=${sessionId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      console.log('✅ History cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing history:', error);
      return false;
    }
  }
}

export const chatHistoryService = ChatHistoryService.getInstance();

