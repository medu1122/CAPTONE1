import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/authService'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  isVerified: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshUser: () => Promise<void>
  checkVerificationStatus: () => Promise<boolean>
  resendVerificationEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      // 1️⃣ Check accessToken trong memory trước
      if (authService.isAuthenticated()) {
        try {
          const response = await authService.getProfile()
          setUser(response.data)
          setIsLoading(false)
          return
        } catch (error) {
          // AccessToken invalid hoặc expired, try refresh
          console.log('AccessToken invalid, trying refresh...')
        }
      }
      
      // 2️⃣ Nếu không có accessToken, check refreshToken để restore session
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken) {
        try {
          console.log('🔄 Restoring session from refreshToken...')
          
          // Call refresh API to get new accessToken
          const refreshResponse = await authService.refreshAccessToken(refreshToken)
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data
          
          // Save new tokens
          ;(window as any).accessToken = accessToken
          localStorage.setItem('refreshToken', newRefreshToken)
          
          // Load user profile with new token
          const profileResponse = await authService.getProfile()
          setUser(profileResponse.data)
          
          console.log('✅ Session restored successfully')
        } catch (error) {
          console.error('❌ Failed to restore session:', error)
          // Refresh failed, clear tokens
          ;(window as any).accessToken = null
          localStorage.removeItem('refreshToken')
        }
      } else {
        console.log('📭 No refresh token found, user not authenticated')
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      setUser(response.data.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const logoutAll = async () => {
    try {
      await authService.logoutAll()
    } catch (error) {
      console.error('Logout all error:', error)
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    if (authService.isAuthenticated()) {
      try {
        const response = await authService.getProfile()
        setUser(response.data)
      } catch (error) {
        console.error('Failed to refresh user profile:', error)
        setUser(null)
      }
    }
  }

  const checkVerificationStatus = async (): Promise<boolean> => {
    try {
      const response = await authService.emailVerification.checkStatus()
      return response.data.isVerified
    } catch (error) {
      console.error('Failed to check verification status:', error)
      return false
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      await authService.emailVerification.resendVerificationEmail(email)
    } catch (error) {
      console.error('Failed to resend verification email:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    logoutAll,
    refreshUser,
    checkVerificationStatus,
    resendVerificationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
