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
    const now = new Date().toISOString();
    
    localStorage.setItem(SESSION_KEY, sessionId);
    
    // Add to sessions list
    const sessions = this.getAllSessions();
    sessions.push({
      id: sessionId,
      createdAt: now,
      lastMessageAt: now,
    });
    
    this.saveSessions(sessions);
    
    console.log('🆕 Created new session:', sessionId);
    return sessionId;
  }

  /**
   * Switch to a different session
   */
  switchSession(sessionId: string): void {
    localStorage.setItem(SESSION_KEY, sessionId);
    
    // Update lastMessageAt
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.lastMessageAt = new Date().toISOString();
      this.saveSessions(sessions);
    }
    
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
    const sessions = this.getAllSessions().filter(s => s.id !== sessionId);
    this.saveSessions(sessions);
    
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
    const sessions = this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.title = title;
      this.saveSessions(sessions);
    }
  }
}

export const sessionService = SessionService.getInstance();

