import axios from 'axios'
import { API_CONFIG } from '../config/api'
import { getAccessToken, getRefreshToken, refreshAccessToken, saveTokens, clearTokens } from './authService'

const API_BASE_URL = API_CONFIG.BASE_URL

// Create axios instance for phone verification
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

export interface PhoneVerificationStatus {
  phone: string | null
  phoneVerified: boolean
}

export interface CreateOTPResponse {
  success: boolean
  message: string
  data: {
    phone: string
    expiresAt: string
  }
}

export interface VerifyPhoneResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      phone: string
      phoneVerified: boolean
    }
  }
}

/**
 * Create phone verification OTP
 */
export const createVerificationOTP = async (phone: string): Promise<CreateOTPResponse> => {
  const response = await api.post('/phone-verification/create-otp', { phone })
  return response.data
}

/**
 * Verify phone with OTP
 */
export const verifyPhone = async (otp: string): Promise<VerifyPhoneResponse> => {
  const response = await api.post('/phone-verification/verify', { otp })
  return response.data
}

/**
 * Check phone verification status
 */
export const checkPhoneVerificationStatus = async (): Promise<PhoneVerificationStatus> => {
  const response = await api.get('/phone-verification/status')
  return response.data.data
}

/**
 * Resend verification OTP
 */
export const resendVerificationOTP = async (): Promise<CreateOTPResponse> => {
  const response = await api.post('/phone-verification/resend')
  return response.data
}

