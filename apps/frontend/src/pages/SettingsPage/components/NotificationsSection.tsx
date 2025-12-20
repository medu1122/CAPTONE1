import React, { useState } from 'react'
import { BellIcon, SaveIcon, XIcon } from 'lucide-react'
import type { UserProfile } from '../../ProfilePage/types'

interface NotificationsSectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  profile,
  onUpdate,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    emailNotifications: profile.settings.emailNotifications,
    smsNotifications: profile.settings.smsNotifications,
  })

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: () => void
  }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )

  const handleSave = async () => {
    setLoading(true)
    try {
      await onUpdate({
        settings: {
          ...profile.settings,
          ...formData,
        },
      })
      showToast('Cập nhật cài đặt thông báo thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      emailNotifications: profile.settings.emailNotifications,
      smsNotifications: profile.settings.smsNotifications,
    })
    setIsEditing(false)
  }

  const handleToggle = (field: keyof typeof formData) => {
    // Prevent enabling SMS notifications if phone is not verified
    if (field === 'smsNotifications' && !formData.smsNotifications && !profile.phoneVerified) {
      showToast('Vui lòng xác thực số điện thoại trước khi bật thông báo SMS', 'error')
      return
    }
    
    setIsEditing(true)
    setFormData({
      ...formData,
      [field]: !formData[field],
    })
  }
  
  // Check if SMS toggle should be disabled
  const isSMSDisabled = !profile.phone || !profile.phoneVerified

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BellIcon className="text-green-600" size={24} />
          Thông báo
        </h2>
        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <label className="text-gray-900 dark:text-white font-medium">Thông báo qua Email</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nhận thông báo về hoạt động tài khoản qua email
            </p>
          </div>
          <ToggleSwitch
            checked={formData.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex-1">
            <label className={`text-gray-900 dark:text-white font-medium ${isSMSDisabled ? 'opacity-50' : ''}`}>
              Thông báo qua SMS
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isSMSDisabled ? (
                <span className="text-orange-600 dark:text-orange-400">
                  Vui lòng thêm và xác thực số điện thoại để sử dụng tính năng này
                </span>
              ) : (
                'Nhận thông báo quan trọng qua tin nhắn SMS'
              )}
            </p>
          </div>
          <div className="relative">
            <ToggleSwitch
              checked={formData.smsNotifications && !isSMSDisabled}
              onChange={() => handleToggle('smsNotifications')}
            />
            {isSMSDisabled && (
              <div className="absolute inset-0 cursor-not-allowed" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

