import React, { useState } from 'react'
import {
  SettingsIcon,
  SaveIcon,
  XIcon,
  BellIcon,
  GlobeIcon,
  EyeIcon,
} from 'lucide-react'
import type { UserProfile } from '../types'
interface SettingsSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  profile,
  onUpdate,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(profile.settings)
  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        settings: formData,
      })
      showToast('Cập nhật cài đặt thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }
  const handleCancel = () => {
    setFormData(profile.settings)
    setIsEditing(false)
  }
  const handleToggle = (field: keyof typeof formData) => {
    setIsEditing(true)
    setFormData({
      ...formData,
      [field]: !formData[field],
    })
  }
  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: () => void
  }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="text-green-600" size={24} />
          Cài đặt
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
      <div className="space-y-6 max-w-2xl">
        {/* Notifications Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <BellIcon size={20} className="text-green-600" />
            Thông báo
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Thông báo qua Email</label>
              <ToggleSwitch
                checked={formData.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Thông báo qua SMS</label>
              <ToggleSwitch
                checked={formData.smsNotifications}
                onChange={() => handleToggle('smsNotifications')}
              />
            </div>
          </div>
        </div>
        {/* Interface Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <GlobeIcon size={20} className="text-green-600" />
            Giao diện
          </h3>
          <div className="space-y-3">
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
            </div>
          </div>
        </div>
        {/* Privacy Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <EyeIcon size={20} className="text-green-600" />
            Quyền riêng tư
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hiển thị hồ sơ
              </label>
              <select
                value={formData.privacy}
                onChange={(e) => {
                  setIsEditing(true)
                  setFormData({
                    ...formData,
                    privacy: e.target.value as 'public' | 'friends' | 'private',
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="public">Công khai</option>
                <option value="friends">Bạn bè</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Hiển thị email</label>
              <ToggleSwitch
                checked={formData.showEmail}
                onChange={() => handleToggle('showEmail')}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Hiển thị số điện thoại</label>
              <ToggleSwitch
                checked={formData.showPhone}
                onChange={() => handleToggle('showPhone')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
