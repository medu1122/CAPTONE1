import { API_CONFIG } from '../config/api';
import axios from 'axios';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Backend message format
export interface HistoryMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  message: string;
  messageType: 'text' | 'image' | 'image-text';
  analysis?: {
    _id: string;
    inputImages?: Array<{
      url?: string;
      base64?: string;
    }>;
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
      // Get access token from memory (same as authService)
      const token = (window as any).accessToken || null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available (optional for guest users)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('🔍 [DEBUG] Loading history for session:', sessionId);

      const response = await api.get(
        `/chat/history?sessionId=${sessionId}&limit=${limit}&page=${page}`,
        { headers }
      );

      console.log('✅ [DEBUG] History loaded:', response.data);

      // Handle different response formats
      let messages = []
      if (response.data?.data?.messages) {
        messages = response.data.data.messages
      } else if (response.data?.messages) {
        messages = response.data.messages
      } else if (Array.isArray(response.data)) {
        messages = response.data
      }

      // Ensure messages is an array
      if (!Array.isArray(messages)) {
        console.warn('⚠️ [chatHistoryService] Messages is not an array:', messages)
        return []
      }

      return messages
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
      const token = (window as any).accessToken || null;
      console.log('🔍 [chatHistoryService] Token check:', {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        windowAccessToken: (window as any).accessToken ? 'exists' : 'missing'
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('🔍 [DEBUG] Loading sessions with axios...');

      const response = await api.get(`/chat-sessions?limit=${limit}&page=${page}`, {
        headers,
      });

      console.log('✅ [DEBUG] Sessions loaded successfully:', response.data);
      
      return response.data.data?.sessions || [];
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Clear history for a session (deletes entire session + messages)
   */
  async clearHistory(sessionId: string): Promise<boolean> {
    try {
      const token = (window as any).accessToken || null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('🗑️ [DELETE] Deleting session:', sessionId);

      // ✅ FIX: Use correct endpoint /chat-sessions/:sessionId (not /chat/sessions)
      // This deletes BOTH the session record AND all messages
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/chat-sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Delete failed:', errorData);
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [DELETE] Session deleted successfully:', result);

      return true;
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      return false;
    }
  }
}

export const chatHistoryService = ChatHistoryService.getInstance();

