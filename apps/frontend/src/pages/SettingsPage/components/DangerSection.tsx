import React, { useState } from 'react'
import { AlertTriangleIcon, TrashIcon } from 'lucide-react'

interface DangerSectionProps {
  showToast: (message: string, type: 'success' | 'error') => void
}

export const DangerSection: React.FC<DangerSectionProps> = ({
  showToast,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('Vui lòng nhập mật khẩu để xác nhận', 'error')
      return
    }

    setLoading(true)
    try {
      // TODO: Implement delete account API
      // await accountService.deleteAccount(deletePassword)
      showToast('Tính năng xóa tài khoản đang được phát triển', 'info')
      setShowDeleteConfirm(false)
      setDeletePassword('')
    } catch (error: any) {
      showToast(error.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-200">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangleIcon className="text-red-600" size={24} />
        <h2 className="text-xl font-semibold text-red-600">Vùng nguy hiểm</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Xóa tài khoản</h3>
          <p className="text-sm text-gray-600 mb-4">
            Khi bạn xóa tài khoản, tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.
            Hãy chắc chắn trước khi thực hiện hành động này.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon size={16} />
              Xóa tài khoản
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangleIcon size={20} />
                <span className="font-medium">Cảnh báo: Hành động này không thể hoàn tác!</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập mật khẩu để xác nhận
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || !deletePassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận xóa'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword('')
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

