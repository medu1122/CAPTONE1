import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/authService'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  isVerified: boolean
  profileImage?: string
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
  const isRefreshingRef = useRef(false); // Prevent double-call from React Strict Mode

  const isAuthenticated = !!user

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent duplicate refresh calls
      if (isRefreshingRef.current) {
        console.log('⏭️ [AuthContext] Refresh already in progress, skipping...');
        return;
      }
      
      console.log('🔍 [AuthContext] Checking authentication...')
      
      // 1️⃣ Check accessToken trong memory trước
      const currentAccessToken = (window as any).accessToken
      console.log('🔍 [AuthContext] AccessToken in memory:', currentAccessToken ? 'EXISTS' : 'NULL')
      
      if (authService.isAuthenticated()) {
        try {
          console.log('🔍 [AuthContext] Attempting to get profile with existing token...')
          const response = await authService.getProfile()
          setUser(response.data)
          setIsLoading(false)
          console.log('✅ [AuthContext] Profile loaded, user authenticated')
          return
        } catch (error) {
          // AccessToken invalid hoặc expired, try refresh
          console.log('⚠️ [AuthContext] AccessToken invalid, trying refresh...', error)
        }
      }
      
      // 2️⃣ Nếu không có accessToken, check refreshToken để restore session
      const refreshToken = localStorage.getItem('refreshToken')
      console.log('🔍 [AuthContext] RefreshToken in localStorage:', refreshToken ? 'EXISTS' : 'NULL')
      
      if (refreshToken) {
        try {
          isRefreshingRef.current = true; // Mark as refreshing
          console.log('🔄 [AuthContext] Restoring session from refreshToken...')
          
          // Call refresh API to get new accessToken
          const refreshResponse = await authService.refreshAccessToken(refreshToken)
          console.log('🔍 [AuthContext] Refresh response:', refreshResponse)
          
          // Backend returns: { success, message, data: { accessToken, refreshToken } }
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data
          console.log('🔍 [AuthContext] New tokens received:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!newRefreshToken
          })
          
          // Save new tokens
          ;(window as any).accessToken = accessToken
          localStorage.setItem('refreshToken', newRefreshToken)
          console.log('💾 [AuthContext] Tokens saved')
          
          // Load user profile with new token
          console.log('🔍 [AuthContext] Loading profile with new token...')
          const profileResponse = await authService.getProfile()
          setUser(profileResponse.data)
          
          console.log('✅ [AuthContext] Session restored successfully')
        } catch (error: any) {
          console.error('❌ [AuthContext] Failed to restore session:', {
            error,
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status
          })
          // Refresh failed, clear tokens
          ;(window as any).accessToken = null
          localStorage.removeItem('refreshToken')
        } finally {
          isRefreshingRef.current = false;
        }
      } else {
        console.log('📭 [AuthContext] No refresh token found, user not authenticated')
      }
      
      setIsLoading(false)
      console.log('🔍 [AuthContext] Auth check completed')
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 [AuthContext] Logging in...')
      const response = await authService.login({ email, password })
      console.log('🔍 [AuthContext] Login response:', {
        hasUser: !!response.data.user,
        hasAccessToken: !!(window as any).accessToken,
        hasRefreshToken: !!localStorage.getItem('refreshToken')
      })
      setUser(response.data.user)
      console.log('✅ [AuthContext] Login successful, user set')
    } catch (error) {
      console.error('❌ [AuthContext] Login failed:', error)
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
