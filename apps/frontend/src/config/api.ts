// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
      LOGOUT: '/auth/logout',
      LOGOUT_ALL: '/auth/logout-all',
    },
    CHAT: {
      SESSIONS: '/chat/sessions',
      MESSAGES: '/chat/messages',
    }
  }
}

export default API_CONFIG
