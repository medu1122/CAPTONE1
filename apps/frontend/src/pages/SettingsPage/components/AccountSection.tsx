import React, { useState } from 'react'
import { UserIcon, EditIcon, CameraIcon, XIcon, SaveIcon } from 'lucide-react'
import type { UserProfile } from '../../ProfilePage/types'
import { getAvatarUrl } from '../../../utils/avatar'

interface AccountSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  onUploadImage: (file: File) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  profile,
  onUpdate,
  onUploadImage,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: profile.username,
    email: profile.email,
    phone: profile.phone || '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB', 'error')
        return
      }
      if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh', 'error')
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

  const handleSave = async () => {
    setLoading(true)
    try {
      if (avatarFile && onUploadImage) {
        await onUploadImage(avatarFile)
        setAvatarFile(null)
        setAvatarPreview(null)
      }
      await onUpdate({
        username: formData.username,
        phone: formData.phone || undefined,
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
      email: profile.email,
      phone: profile.phone || '',
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserIcon className="text-green-600" size={24} />
          Tài khoản
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

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={avatarPreview || getAvatarUrl(profile.avatar)}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            {isEditing && (
              <label className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full cursor-pointer hover:bg-green-700 transition-colors">
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
          <div>
            <p className="text-sm text-gray-500">Ảnh đại diện</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG tối đa 5MB</p>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên người dùng
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 py-2">{profile.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <p className="text-gray-900 py-2">{profile.email}</p>
          <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 py-2">
              {profile.phone || <span className="text-gray-400">Chưa có</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

