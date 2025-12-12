// API Configuration
const getBaseURL = () => {
  // If VITE_API_URL is set in .env, use it (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const port = window.location.port || '5173';
  
  // If accessing via localhost, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000/api/v1';
  }
  
  // If accessing via LAN IP (IPv4 format), use same IP for backend
  // Check if hostname is an IP address (IPv4)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    return `http://${hostname}:4000/api/v1`;
  }
  
  // If accessing via domain name or other, try to use hostname
  // This handles cases like accessing via computer name
  return `http://${hostname}:4000/api/v1`;
};

console.log('🌐 [API Config] Backend URL:', getBaseURL());

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
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
    PASSWORD_CHANGE_OTP: {
      GENERATE: '/password-change-otp/generate',
      VERIFY: '/password-change-otp/verify'
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
    NOTIFICATIONS: {
      LIST: '/notifications',
      UNREAD_COUNT: '/notifications/unread-count',
      MARK_READ: '/notifications/:id/read',
      MARK_ALL_READ: '/notifications/read-all',
      STREAM: '/notifications/stream'
    },
    ALERTS: {
      LIST: '/alerts',
      CREATE: '/alerts',
      UPDATE: '/alerts/:id',
      DELETE: '/alerts/:id'
    },
    HEALTH: {
      CHECK: '/health'
    },
    ANALYSES: {
      MY_PLANTS: '/analyses/my-plants',
      DETAIL: '/analyses/:id',
      DELETE: '/analyses/:id'
    },
    PLANT_BOXES: {
      LIST: '/plant-boxes',
      DETAIL: '/plant-boxes/:id',
      CREATE: '/plant-boxes',
      UPDATE: '/plant-boxes/:id',
      DELETE: '/plant-boxes/:id',
      REFRESH_STRATEGY: '/plant-boxes/:id/refresh-strategy',
      CHAT: '/plant-boxes/:id/chat',
      ADD_NOTE: '/plant-boxes/:id/notes',
      ADD_IMAGE: '/plant-boxes/:id/images'
    },
    TREATMENTS: {
      SEARCH_DISEASES: '/treatments/search-diseases'
    }
  }
}

export default API_CONFIG
