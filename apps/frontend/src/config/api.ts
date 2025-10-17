// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  TIMEOUT: 10000,
  
  // External Services Configuration
  CLOUDINARY: {
    CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dky5snbq3',
    API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY || '781786452761982',
    API_SECRET: import.meta.env.VITE_CLOUDINARY_API_SECRET || 'rl_eWEODOBE004U0VUs4ICKPmNg',
    SECURE: true,
    FOLDER: 'greengrow/plants'
  },
  
  OPENWEATHER: {
    API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY || '8746155ce8ae7dc53fc1878b6e204099',
    BASE_URL: 'https://api.openweathermap.org',
    GEOCODING_URL: 'https://api.openweathermap.org/geo/1.0',
    WEATHER_URL: 'https://api.openweathermap.org/data/2.5'
  },
  
  WEBSOCKET: {
    URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:4001',
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000,
    HEARTBEAT_INTERVAL: 30000
  },
  
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
    },
    CHAT_ANALYZE: {
      MAIN: '/chat-analyze',
      STREAM: '/chat-analyze/stream',
      TEXT_ONLY: '/chat-analyze/text',
      IMAGE_ONLY: '/chat-analyze/image',
      IMAGE_TEXT: '/chat-analyze/image-text',
      STATUS: '/chat-analyze/status'
    },
    WEATHER: {
      CURRENT: '/weather',
      ALERTS: '/weather/alerts'
    },
    PLANTS: {
      LIST: '/plants',
      SEARCH: '/plants/search',
      CATEGORY: '/plants/category',
      DETAIL: '/plants/:id',
      CREATE: '/plants'
    },
    PRODUCTS: {
      RECOMMENDATIONS: '/products/recommendations',
      SEARCH: '/products/search',
      CATEGORY: '/products/category',
      DETAIL: '/products/:id',
      CREATE: '/products'
    },
    AI_ASSISTANT: {
      RESPOND: '/ai/respond',
      NEED_IMAGE_ANALYSIS: '/ai/need-image-analysis',
      NEED_PRODUCT_RECOMMENDATIONS: '/ai/need-product-recommendations'
    },
    EMAIL_VERIFICATION: {
      CREATE_TOKEN: '/email-verification/create-token',
      VERIFY: '/email-verification/verify',
      STATUS: '/email-verification/status',
      RESEND: '/email-verification/resend'
    },
    PASSWORD_RESET: {
      REQUEST: '/password-reset/request',
      VALIDATE_TOKEN: '/password-reset/validate-token',
      RESET: '/password-reset/reset',
      PENDING_RESETS: '/password-reset/pending-resets'
    },
    CHAT_SESSIONS: {
      LIST: '/chat-sessions',
      CREATE: '/chat-sessions',
      DETAIL: '/chat-sessions/:sessionId',
      UPDATE_TITLE: '/chat-sessions/:sessionId/title',
      UPDATE_META: '/chat-sessions/:sessionId/meta',
      DELETE: '/chat-sessions/:sessionId'
    },
    POSTS: {
      LIST: '/posts',
      CREATE: '/posts',
      DETAIL: '/posts/:id',
      UPDATE: '/posts/:id',
      DELETE: '/posts/:id'
    },
    ALERTS: {
      LIST: '/alerts',
      CREATE: '/alerts',
      UPDATE: '/alerts/:id',
      DELETE: '/alerts/:id'
    },
    HEALTH: {
      CHECK: '/health'
    }
  }
}

export default API_CONFIG
