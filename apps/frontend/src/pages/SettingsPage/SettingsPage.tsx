import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { Toast } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'
import type { UserProfile } from '../ProfilePage/types'
import { AccountSection } from './components/AccountSection.tsx'
import { SecuritySection } from './components/SecuritySection.tsx'
import { NotificationsSection } from './components/NotificationsSection.tsx'
import { AppearanceSection } from './components/AppearanceSection.tsx'
import { PrivacySection } from './components/PrivacySection.tsx'
import { SessionsSection } from './components/SessionsSection.tsx'
import { DangerSection } from './components/DangerSection.tsx'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, logout, logoutAll } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profileData = await profileService.getProfile()
        setProfile(profileData)
      } catch (error: any) {
        console.error('Failed to fetch profile:', error)
        showToast(error.message || 'Không thể tải thông tin', 'error')
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          navigate('/auth')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isAuthenticated, navigate])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return

    try {
      const updatedProfile = await profileService.updateProfile(data)
      setProfile(updatedProfile)
      showToast('Cập nhật thành công', 'success')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      showToast(error.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error')
      throw error
    }
  }

  const handleUploadImage = async (file: File) => {
    if (!profile) return

    try {
      const updatedProfile = await profileService.uploadProfileImage(file)
      setProfile(updatedProfile)
      showToast('Cập nhật ảnh đại diện thành công', 'success')
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      showToast(error.message || 'Không thể tải ảnh lên', 'error')
      throw error
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không thể tải thông tin</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-gray-600 mt-2">
            Quản lý cài đặt tài khoản và tùy chọn của bạn
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          <AccountSection
            profile={profile}
            onUpdate={handleUpdateProfile}
            onUploadImage={handleUploadImage}
            showToast={showToast}
          />

          <SecuritySection
            showToast={showToast}
          />

          <NotificationsSection
            profile={profile}
            onUpdate={handleUpdateProfile}
            showToast={showToast}
          />

          <AppearanceSection
            profile={profile}
            onUpdate={handleUpdateProfile}
            showToast={showToast}
          />

          <PrivacySection
            profile={profile}
            onUpdate={handleUpdateProfile}
            showToast={showToast}
          />

          <SessionsSection
            onLogout={logout}
            onLogoutAll={logoutAll}
            showToast={showToast}
          />

          <DangerSection
            showToast={showToast}
          />
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default SettingsPage

