import React, { useState } from 'react'
import { XIcon, AlertCircleIcon } from 'lucide-react'
import { adminService } from '../services/adminService'

interface ComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'analysis' | 'chatbot' | 'my-plants' | 'map' | 'general'
  relatedId?: string
  relatedType?: 'analysis' | 'post' | 'plant' | 'plantBox' | 'map'
  onSuccess?: () => void
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  type,
  relatedId,
  relatedType,
  onSuccess,
}) => {
  const [category, setCategory] = useState<'error' | 'suggestion' | 'bug' | 'other'>('other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const typeLabels = {
    analysis: 'Phân tích ảnh',
    chatbot: 'Chatbot',
    'my-plants': 'Vườn của tôi',
    map: 'Bản đồ',
    general: 'Tổng quát',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim()) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (description.length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự')
      return
    }

    setLoading(true)
    try {
      const complaintData = {
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        relatedId: relatedId || null,
        relatedType: relatedType || null,
      }
      
      console.log('📝 [ComplaintModal] Submitting complaint:', complaintData)
      
      const result = await adminService.createComplaint(complaintData)
      
      console.log('✅ [ComplaintModal] Complaint created successfully:', result)
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('other')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('❌ [ComplaintModal] Error creating complaint:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi khiếu nại')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircleIcon className="text-orange-600" size={24} />
            <h3 className="text-xl font-semibold">Gửi khiếu nại - {typeLabels[type]}</h3>
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
              Phân loại
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="error">Lỗi</option>
              <option value="suggestion">Gợi ý</option>
              <option value="bug">Bug</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kết quả phân tích không chính xác"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/200 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              rows={6}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/2000 ký tự</p>
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
              disabled={loading || !title.trim() || !description.trim()}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

