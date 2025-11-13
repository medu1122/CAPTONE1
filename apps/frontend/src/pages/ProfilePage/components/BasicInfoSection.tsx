import React, { useState } from 'react'
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CameraIcon,
  CheckCircleIcon,
} from 'lucide-react'
import type { UserProfile } from '../types'
interface BasicInfoSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  onUploadImage?: (file: File) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}
export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  profile,
  onUpdate,
  onUploadImage,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: profile.username,
    phone: profile.phone || '',
    bio: profile.bio || '',
  })
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.username.trim()) {
      newErrors.username = 'Tên không được để trống'
    }
    if (
      formData.phone &&
      !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))
    ) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)'
    }
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Giới thiệu không được vượt quá 500 ký tự'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSave = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      // Upload image first if there's a new file
      if (avatarFile && onUploadImage) {
        await onUploadImage(avatarFile)
        setAvatarFile(null)
      }

      // Update other profile data
      await onUpdate({
        username: formData.username,
        phone: formData.phone,
        bio: formData.bio,
      })
      showToast('Cập nhật thông tin thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }
  const handleCancel = () => {
    setFormData({
      username: profile.username,
      phone: profile.phone || '',
      bio: profile.bio || '',
    })
    setAvatarPreview(profile.avatar || '')
    setAvatarFile(null)
    setErrors({})
    setIsEditing(false)
  }
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh', 'error')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB', 'error')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserIcon className="text-green-600" size={24} />
          Thông tin cơ bản
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <EditIcon size={16} />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon size={16} />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <SaveIcon size={16} />
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section - Left */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-50">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={48} className="text-gray-400" />
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 transition-colors shadow-lg">
                <CameraIcon size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {profile.isVerified && (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircleIcon size={16} />
              <span className="text-sm font-medium">Đã xác thực</span>
            </div>
          )}
        </div>
        {/* Form Section - Right */}
        <div className="md:col-span-2 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nhập tên của bạn"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-900 py-2">{profile.username}</p>
            )}
          </div>
          {/* Email - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MailIcon size={16} />
              Email
            </label>
            <div className="flex items-center gap-2">
              <p className="text-gray-500 py-2">{profile.email}</p>
              {profile.isVerified && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
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
            {isEditing ? (
              <div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Nhập số điện thoại (tùy chọn)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-900 py-2">
                {profile.phone || (
                  <span className="text-gray-400">Chưa có thông tin</span>
                )}
              </p>
            )}
          </div>
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới thiệu bản thân
            </label>
            {isEditing ? (
              <div>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bio: e.target.value,
                    })
                  }
                  placeholder="Viết vài dòng giới thiệu về bạn... (tối đa 500 ký tự)"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between mt-1">
                  {errors.bio && (
                    <p className="text-red-500 text-sm">{errors.bio}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {formData.bio.length}/500
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap py-2">
                {profile.bio || (
                  <span className="text-gray-400">Chưa có thông tin</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
