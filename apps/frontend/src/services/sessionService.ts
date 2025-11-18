import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'gg_current_session_id';
const SESSIONS_KEY = 'gg_all_sessions';

export interface Session {
  id: string;
  createdAt: string;
  lastMessageAt: string;
  title?: string;
}

class SessionService {
  private static instance: SessionService;

  private constructor() {}

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Get current session ID or create new one
   */
  getCurrentSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_KEY);
    
    if (!sessionId) {
      sessionId = this.createSession();
    }
    
    return sessionId;
  }

  /**
   * Create a new session
   */
  createSession(): string {
    const sessionId = uuidv4();
    
    localStorage.setItem(SESSION_KEY, sessionId);
    
    // DON'T save to localStorage - backend is source of truth
    
    console.log('🆕 Created new session:', sessionId);
    return sessionId;
  }

  /**
   * Switch to a different session
   */
  switchSession(sessionId: string): void {
    localStorage.setItem(SESSION_KEY, sessionId);
    
    // DON'T update localStorage - backend tracks lastMessageAt
    
    console.log('🔄 Switched to session:', sessionId);
  }

  /**
   * Get all sessions from localStorage
   */
  getAllSessions(): Session[] {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  /**
   * Save sessions to localStorage
   */
  private saveSessions(sessions: Session[]): void {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    // DON'T delete from localStorage - backend handles deletion
    
    // If deleted current session, create new one
    if (this.getCurrentSessionId() === sessionId) {
      this.createSession();
    }
    
    console.log('🗑️ Deleted session:', sessionId);
  }

  /**
   * Update session title
   */
  updateSessionTitle(sessionId: string, title: string): void {
    // DON'T update localStorage - backend handles titles
    console.log('📝 Session title update (backend only):', sessionId, title);
  }
}

export const sessionService = SessionService.getInstance();

