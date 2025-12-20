import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  EditIcon,
  CheckCircleIcon,
} from 'lucide-react'
import type { UserProfile } from '../types'
import { getAvatarUrl } from '../../../utils/avatar'

interface BasicInfoSectionProps {
  profile: UserProfile
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  profile,
}) => {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserIcon className="text-green-600" size={24} />
          Thông tin cơ bản
        </h2>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          <EditIcon size={16} />
          Chỉnh sửa
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section - Left */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-50">
            <img
              src={getAvatarUrl(profile.avatar)}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {profile.isVerified && (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircleIcon size={16} />
              <span className="text-sm font-medium">Đã xác thực</span>
            </div>
          )}
        </div>
        {/* Info Section - Right (Read Only) */}
        <div className="md:col-span-2 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên
            </label>
            <p className="text-gray-900 py-2">{profile.username}</p>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MailIcon size={16} />
              Email
            </label>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 py-2">{profile.email}</p>
              {profile.isVerified && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircleIcon size={12} />
                  Đã xác thực
                </span>
              )}
            </div>
          </div>
          
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <PhoneIcon size={16} />
              Số điện thoại
            </label>
            <p className="text-gray-900 py-2">
              {profile.phone || (
                <span className="text-gray-400">Chưa cập nhật</span>
              )}
            </p>
          </div>
          
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới thiệu bản thân
            </label>
            <p className="text-gray-900 whitespace-pre-wrap py-2">
              {profile.bio || (
                <span className="text-gray-400">Chưa có thông tin</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
