import React, { useState } from 'react'
import { EyeIcon, SaveIcon, XIcon } from 'lucide-react'
import type { UserProfile } from '../../ProfilePage/types'

interface PrivacySectionProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  profile,
  onUpdate,
  showToast,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    privacy: profile.settings.privacy,
    showEmail: profile.settings.showEmail,
    showPhone: profile.settings.showPhone,
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
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
          privacy: formData.privacy,
          showEmail: formData.showEmail,
          showPhone: formData.showPhone,
        },
      })
      showToast('Cập nhật quyền riêng tư thành công', 'success')
      setIsEditing(false)
    } catch (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      privacy: profile.settings.privacy,
      showEmail: profile.settings.showEmail,
      showPhone: profile.settings.showPhone,
    })
    setIsEditing(false)
  }

  const handleToggle = (field: 'showEmail' | 'showPhone') => {
    setIsEditing(true)
    setFormData({
      ...formData,
      [field]: !formData[field],
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <EyeIcon className="text-green-600" size={24} />
          Quyền riêng tư
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
            <option value="public">Công khai - Mọi người có thể xem</option>
            <option value="friends">Bạn bè - Chỉ bạn bè có thể xem</option>
            <option value="private">Riêng tư - Chỉ bạn có thể xem</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <div>
            <label className="text-gray-900 font-medium">Hiển thị email</label>
            <p className="text-sm text-gray-500 mt-1">
              Cho phép người khác xem email của bạn
            </p>
          </div>
          <ToggleSwitch
            checked={formData.showEmail}
            onChange={() => handleToggle('showEmail')}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <div>
            <label className="text-gray-900 font-medium">Hiển thị số điện thoại</label>
            <p className="text-sm text-gray-500 mt-1">
              Cho phép người khác xem số điện thoại của bạn
            </p>
          </div>
          <ToggleSwitch
            checked={formData.showPhone}
            onChange={() => handleToggle('showPhone')}
          />
        </div>
      </div>
    </div>
  )
}

