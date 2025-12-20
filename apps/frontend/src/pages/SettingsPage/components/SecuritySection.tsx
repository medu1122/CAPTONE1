import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LockIcon, ArrowRightIcon } from 'lucide-react'

interface SecuritySectionProps {
  showToast?: (message: string, type: 'success' | 'error') => void
}

export const SecuritySection: React.FC<SecuritySectionProps> = () => {
  const navigate = useNavigate()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bảo mật</h2>
      </div>

      <div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Đảm bảo tài khoản của bạn an toàn bằng cách thay đổi mật khẩu thường xuyên.
        </p>
        <button
          onClick={() => navigate('/change-password')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <LockIcon size={18} />
          <span>Đổi mật khẩu</span>
          <ArrowRightIcon size={18} />
        </button>
      </div>
    </div>
  )
}

