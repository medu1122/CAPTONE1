import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

// Create axios instance for email verification
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

// Token management functions
const getAccessToken = (): string | null => {
  return (window as any).accessToken || null
}

export const emailVerificationService = {
  /**
   * Verify email with token and user ID
   * @param token - Verification token from email
   * @param uid - User ID from email
   * @returns Promise with verification result
   */
  verifyEmail: async (token: string, uid: string) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}&uid=${uid}`)
      return response.data
    } catch (error: any) {
      console.error('Email verification error:', error)
      throw error
    }
  },

  /**
   * Resend verification email
   * @param email - User email address
   * @returns Promise with resend result
   */
  resendVerificationEmail: async (email: string) => {
    try {
      const response = await api.post('/auth/verify-email/resend', { email })
      return response.data
    } catch (error: any) {
      console.error('Resend verification error:', error)
      throw error
    }
  },

  /**
   * Check verification status (requires authentication)
   * @returns Promise with verification status
   */
  checkVerificationStatus: async () => {
    try {
      const response = await api.get('/auth/verify-status')
      return response.data
    } catch (error: any) {
      console.error('Check verification status error:', error)
      throw error
    }
  },

  /**
   * Get verification status from user profile
   * @returns Promise with user verification status
   */
  getProfileVerificationStatus: async () => {
    try {
      const response = await api.get('/auth/profile')
      return {
        isVerified: response.data.data.isVerified,
        email: response.data.data.email
      }
    } catch (error: any) {
      console.error('Get profile verification status error:', error)
      throw error
    }
  }
}

export default emailVerificationService
