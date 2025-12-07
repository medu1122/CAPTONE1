import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Settings, Mail, CheckCircle, Shield } from 'lucide-react'
import { getUserAvatar } from '../utils/avatar'
import { authService } from '../services/authService'
import { NotificationIcon } from './NotificationIcon'

export const UserMenu: React.FC = () => {
  const { user, logout, logoutAll } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        const profileResponse = await authService.getProfile()
        setIsAdmin(profileResponse.data?.role === 'admin')
      } catch (error) {
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [user])

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  const handleLogoutAll = async () => {
    await logoutAll()
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative flex items-center gap-2">
      {/* Notification Icon */}
      <NotificationIcon />
      
      {/* User Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <img
          src={getUserAvatar(user)}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
        />
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  src={getUserAvatar(user)}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <div className="flex items-center mt-1">
                    {user.isVerified ? (
                      <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã xác thực
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-600 text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Chưa xác thực
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/profile')
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/settings')
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
              </button>
              
              {/* Admin Dashboard Link - Only for admins */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/admin')
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </button>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
              
              <button
                onClick={handleLogoutAll}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
               
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserMenu
