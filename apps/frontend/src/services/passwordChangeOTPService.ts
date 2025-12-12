import axios from 'axios'
import { API_CONFIG } from '../config/api'
import { getAccessToken } from './authService'

const API_BASE_URL = API_CONFIG.BASE_URL

export interface GenerateOTPResponse {
  success: boolean
  message: string
  data: {
    expiresAt: string
    userEmail: string
  }
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  data: {
    verificationToken: string
    expiresAt: string
  }
}

export const passwordChangeOTPService = {
  /**
   * Generate and send OTP for password change
   */
  generateOTP: async (): Promise<GenerateOTPResponse['data']> => {
    try {
      const token = getAccessToken()
      const response = await axios.post<GenerateOTPResponse>(
        `${API_BASE_URL}/password-change-otp/generate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate OTP')
      }
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth'
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate OTP')
    }
  },

  /**
   * Verify OTP for password change
   */
  verifyOTP: async (otp: string): Promise<VerifyOTPResponse['data']> => {
    try {
      const token = getAccessToken()
      const response = await axios.post<VerifyOTPResponse>(
        `${API_BASE_URL}/password-change-otp/verify`,
        { otp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to verify OTP')
      }
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth'
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to verify OTP')
    }
  },
}

