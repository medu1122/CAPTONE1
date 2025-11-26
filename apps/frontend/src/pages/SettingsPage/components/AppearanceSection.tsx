import React, { useState, useEffect } from 'react'
import { PaletteIcon, SaveIcon, XIcon } from 'lucide-react'
import type { UserProfile } from '../../ProfilePage/types'

interface AppearanceSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  profile,
  onUpdate,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    language: profile.settings.language,
    theme: profile.settings.theme,
  })

  // Apply theme immediately when changed
  useEffect(() => {
    if (formData.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [formData.theme])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        settings: {
          ...profile.settings,
          ...formData,
        },
      })
      showToast('Cập nhật giao diện thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      language: profile.settings.language,
      theme: profile.settings.theme,
    })
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <PaletteIcon className="text-green-600" size={24} />
          Giao diện
        </h2>
        {isEditing && (
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngôn ngữ
          </label>
          <select
            value={formData.language}
            onChange={(e) => {
              setIsEditing(true)
              setFormData({
                ...formData,
                language: e.target.value as 'vi' | 'en',
              })
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chủ đề
          </label>
          <select
            value={formData.theme}
            onChange={(e) => {
              setIsEditing(true)
              setFormData({
                ...formData,
                theme: e.target.value as 'light' | 'dark',
              })
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Thay đổi sẽ được áp dụng ngay lập tức
          </p>
        </div>
      </div>
    </div>
  )
}

