import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Header } from '../ChatAnalyzePage/components/layout/Header'
import { Toast } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'
import { getAvatarUrl } from '../../utils/avatar'
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BarChart3Icon,
  LockIcon,
  ArrowLeftIcon,
} from 'lucide-react'

interface PublicProfile {
  _id: string
  username: string
  email?: string | null
  phone?: string | null
  avatar?: string
  bio?: string
  isVerified: boolean
  address?: {
    street?: string
    province?: string
    district?: string
  }
  statistics: {
    posts: number
    comments: number
    likes: number
    plants: number
  }
  joinDate?: string
  profileVisibility: 'public' | 'private' | 'friends'
}

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!userId) {
      setError('User ID không hợp lệ')
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const profileData = await profileService.getPublicProfile(userId)
        setProfile(profileData as any)
      } catch (error: any) {
        console.error('Failed to fetch profile:', error)
        setError(error.message || 'Không thể tải thông tin hồ sơ')
        showToast(error.message || 'Không thể tải thông tin hồ sơ', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const isOwnProfile = currentUser && profile && currentUser.id === profile._id

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải hồ sơ...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <LockIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {error?.includes('riêng tư') ? 'Hồ sơ riêng tư' : 'Không tìm thấy'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'Không thể tải thông tin hồ sơ'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeftIcon size={16} />
                  Quay lại
                </button>
                <Link
                  to="/community"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Về cộng đồng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon size={16} />
          Quay lại
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={getAvatarUrl(profile.avatar)}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
              />
              {profile.isVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
                {profile.isVerified && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Đã xác thực
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {profile.joinDate && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon size={16} />
                    <span>Tham gia: {new Date(profile.joinDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <BarChart3Icon size={16} />
                  <span>{profile.statistics.posts} bài viết</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <Link
                to="/profile"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Chỉnh sửa hồ sơ
              </Link>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="text-green-600" size={20} />
              Thông tin liên hệ
            </h2>
            <div className="space-y-3">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <MailIcon className="text-gray-400" size={18} />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="text-gray-400" size={18} />
                  <span className="text-gray-700">{profile.phone}</span>
                </div>
              )}
              {!profile.email && !profile.phone && (
                <p className="text-gray-400 text-sm">Thông tin liên hệ không được hiển thị</p>
              )}
            </div>
          </div>

          {/* Location */}
          {profile.address && (profile.address.street || profile.address.province || profile.address.district) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon className="text-green-600" size={20} />
                Địa chỉ
              </h2>
              <div className="space-y-2 text-gray-700">
                {profile.address.street && <p>{profile.address.street}</p>}
                {(profile.address.district || profile.address.province) && (
                  <p>
                    {[profile.address.district, profile.address.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3Icon className="text-green-600" size={20} />
              Thống kê hoạt động
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{profile.statistics.posts}</div>
                <div className="text-sm text-gray-600 mt-1">Bài viết</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{profile.statistics.comments}</div>
                <div className="text-sm text-gray-600 mt-1">Bình luận</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{profile.statistics.likes}</div>
                <div className="text-sm text-gray-600 mt-1">Lượt thích</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{profile.statistics.plants}</div>
                <div className="text-sm text-gray-600 mt-1">Cây trồng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default PublicProfilePage

