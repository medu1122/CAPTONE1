import React, { useState } from 'react'
import { LogOutIcon, AlertCircleIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SessionsSectionProps {
  onLogout: () => Promise<void>
  onLogoutAll: () => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export const SessionsSection: React.FC<SessionsSectionProps> = ({
  onLogout,
  onLogoutAll,
  showToast,
}) => {
  const navigate = useNavigate()
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await onLogout()
      showToast('Đăng xuất thành công', 'success')
      navigate('/auth')
    } catch (error) {
      showToast('Có lỗi xảy ra khi đăng xuất', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutAll = async () => {
    setLoading(true)
    try {
      await onLogoutAll()
      showToast('Đã đăng xuất khỏi tất cả thiết bị', 'success')
      navigate('/auth')
    } catch (error) {
      showToast('Có lỗi xảy ra khi đăng xuất', 'error')
    } finally {
      setLoading(false)
      setShowLogoutAllConfirm(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <LogOutIcon className="text-green-600" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">Phiên đăng nhập</h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-gray-600 mb-4">
            Quản lý các phiên đăng nhập của bạn trên các thiết bị khác nhau.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <LogOutIcon size={16} />
            Đăng xuất
          </button>

          {!showLogoutAllConfirm ? (
            <button
              onClick={() => setShowLogoutAllConfirm(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <LogOutIcon size={16} />
              Đăng xuất tất cả thiết bị
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircleIcon className="text-red-600" size={16} />
                <span className="text-sm text-red-800">Xác nhận đăng xuất tất cả?</span>
              </div>
              <button
                onClick={handleLogoutAll}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button
                onClick={() => setShowLogoutAllConfirm(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

