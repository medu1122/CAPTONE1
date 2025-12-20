import React from 'react'
import { PaletteIcon } from 'lucide-react'
import type { UserProfile } from '../../ProfilePage/types'
import { useTheme } from '../../../contexts/ThemeContext'

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
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    showToast('Chủ đề đã được áp dụng', 'success')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <PaletteIcon className="text-green-600" size={24} />
          Giao diện
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ngôn ngữ
          </label>
          <input
            type="text"
            value="Tiếng Việt"
            disabled
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ứng dụng hiện chỉ hỗ trợ tiếng Việt
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chủ đề
          </label>
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Thay đổi được áp dụng ngay lập tức - Không cần lưu
          </p>
        </div>
      </div>
    </div>
  )
}

