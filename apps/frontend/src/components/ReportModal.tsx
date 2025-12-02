import React, { useState } from 'react'
import { XIcon, FlagIcon } from 'lucide-react'
import { adminService } from '../services/adminService'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'post' | 'comment'
  targetId: string
  onSuccess?: () => void
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  onSuccess,
}) => {
  const [reason, setReason] = useState<'spam' | 'inappropriate' | 'harassment' | 'fake' | 'other'>('spam')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reasonLabels = {
    spam: 'Spam',
    inappropriate: 'Nội dung không phù hợp',
    harassment: 'Quấy rối',
    fake: 'Thông tin sai sự thật',
    other: 'Khác',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setLoading(true)
    try {
      await adminService.createReport({
        type,
        targetId,
        targetType: type,
        reason,
        description: description.trim() || undefined,
      })
      
      // Reset form
      setDescription('')
      setReason('spam')
      onSuccess?.()
      onClose()
      alert('Báo cáo đã được gửi thành công. Cảm ơn bạn đã giúp cải thiện cộng đồng!')
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Bạn đã báo cáo mục này rồi')
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlagIcon className="text-red-600" size={24} />
            <h3 className="text-xl font-semibold">Báo cáo {type === 'post' ? 'bài viết' : 'bình luận'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do báo cáo <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {Object.entries(reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả thêm về vấn đề..."
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/1000 ký tự</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

