import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface VerifiedRouteProps {
  children: React.ReactNode
}

export const VerifiedRoute: React.FC<VerifiedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkVerification = async () => {
      if (isLoading) {
        return
      }

      if (!isAuthenticated) {
        setIsChecking(false)
        return
      }

      // Refresh user data to get latest verification status
      if (user && !user.isVerified) {
        try {
          await refreshUser()
        } catch (error) {
          console.error('Failed to refresh user:', error)
        }
      }

      setIsChecking(false)
    }

    checkVerification()
  }, [isAuthenticated, isLoading, user, refreshUser])

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to auth page with return url
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (!user?.isVerified) {
    // Redirect to email verification page
    return <Navigate to="/verify-email" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default VerifiedRoute

