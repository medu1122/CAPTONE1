/**
 * Chat module constants
 */

export const CHAT_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
};

export const CHAT_LIMITS = {
  MESSAGE_MAX_LENGTH: 8000,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  SESSION_ID_LENGTH: 36, // UUID v4 length
};

export const CHAT_ERRORS = {
  SESSION_NOT_FOUND: 'Session not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  INVALID_SESSION_ACCESS: 'Invalid session access',
  INVALID_MESSAGE_ACCESS: 'Invalid message access',
};

export const CHAT_SUCCESS = {
  SESSION_CREATED: 'Session created successfully',
  MESSAGE_SENT: 'Message sent successfully',
  HISTORY_RETRIEVED: 'History retrieved successfully',
  SESSIONS_LISTED: 'Sessions listed successfully',
  SESSION_DELETED: 'Session deleted successfully',
  MESSAGE_DELETED: 'Message deleted successfully',
};
