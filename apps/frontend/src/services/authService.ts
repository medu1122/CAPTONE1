import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Flag to prevent multiple refresh calls
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          const response = await refreshAccessToken(refreshToken)
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          
          // Save new tokens
          saveTokens(accessToken, newRefreshToken)
          
          // Process queued requests
          processQueue(null, accessToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } else {
          // No refresh token, redirect to login
          processQueue(error, null)
          clearTokens()
          window.location.href = '/auth'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/auth'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Token management functions
export const getAccessToken = (): string | null => {
  return (window as any).accessToken || null
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken')
}

export const saveTokens = (accessToken: string, refreshToken: string): void => {
  // Store access token in memory (not localStorage for security)
  ;(window as any).accessToken = accessToken
  localStorage.setItem('refreshToken', refreshToken)
}

export const clearTokens = (): void => {
  ;(window as any).accessToken = null
  localStorage.removeItem('refreshToken')
}

// Auth service functions
export const authService = {
  // Register new user
  register: async (userData: {
    name: string
    email: string
    password: string
  }) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Login user
  login: async (credentials: {
    email: string
    password: string
  }) => {
    const response = await api.post('/auth/login', credentials)
    const { accessToken, refreshToken } = response.data.data
    
    // Save tokens
    saveTokens(accessToken, refreshToken)
    
    return response.data
  },

  // Refresh access token
  refreshAccessToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  // Logout current device
  logout: async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error)
      }
    }
    clearTokens()
  },

  // Logout all devices
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all')
    } catch (error) {
      console.warn('Logout all API call failed:', error)
    }
    clearTokens()
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!getAccessToken()
  },

  // Email verification methods
  emailVerification: {
    // Verify email with token and user ID
    verifyEmail: async (token: string, uid: string) => {
      const response = await api.get(`/auth/verify-email?token=${token}&uid=${uid}`)
      return response.data
    },

    // Resend verification email
    resendVerificationEmail: async (email: string) => {
      const response = await api.post('/auth/verify-email/resend', { email })
      return response.data
    },

    // Check verification status
    checkStatus: async () => {
      const response = await api.get('/auth/verify-status')
      return response.data
    }
  }
}

// Export the refresh function for interceptor use
const refreshAccessToken = authService.refreshAccessToken

export default authService
