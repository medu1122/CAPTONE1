import React, { useEffect, useState } from 'react'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { Toast } from '../../components/ui/Toast'
import type { UserProfile } from './types/profile.types'
import { BasicInfoSection } from './components/BasicInfoSection'
import { AddressSection } from './components/AddressSection'
import { StatisticsSection } from './components/StatisticsSection'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<
    'basic' | 'address' | 'stats'
  >('basic')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)
  
  // User profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Fetch profile on mount
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
        showToast(error.message || 'Không thể tải thông tin hồ sơ', 'error')
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
    setToast({
      message,
      type,
    })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return
    
    try {
      const updatedProfile = await profileService.updateProfile(data)
      setProfile(updatedProfile)
      showToast('Cập nhật thông tin thành công', 'success')
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
  const tabs = [
    {
      id: 'basic' as const,
      label: 'Thông tin cơ bản',
    },
    {
      id: 'address' as const,
      label: 'Địa chỉ',
    },
    {
      id: 'stats' as const,
      label: 'Thống kê',
    },
  ]
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
          <p className="text-gray-600">Không thể tải thông tin hồ sơ</p>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ người dùng</h1>
          <p className="text-gray-600 mt-2">
            Quản lý thông tin cá nhân của bạn
          </p>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        <div>
          {activeTab === 'basic' && (
            <BasicInfoSection
              profile={profile}
              onUpdate={handleUpdateProfile}
              onUploadImage={handleUploadImage}
              showToast={showToast}
            />
          )}
          {activeTab === 'address' && (
            <AddressSection
              profile={profile}
              onUpdate={handleUpdateProfile}
              showToast={showToast}
            />
          )}
          {activeTab === 'stats' && <StatisticsSection profile={profile} />}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
