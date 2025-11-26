import React, { useState } from 'react'
import { XIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'

interface ModerationIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  location: string
  suggestion: string
}

interface ModerationModalProps {
  isOpen: boolean
  onClose: () => void
  reason: string
  issues: ModerationIssue[]
  suggestedContent: string | null
  originalContent: {
    title?: string
    content: string
  }
  onEdit: (editedContent: { title?: string; content: string }) => void
  type?: 'post' | 'comment'
}

export const ModerationModal: React.FC<ModerationModalProps> = ({
  isOpen,
  onClose,
  reason,
  issues,
  suggestedContent,
  originalContent,
  onEdit,
  type = 'post',
}) => {
  const [editedTitle, setEditedTitle] = useState(originalContent.title || '')
  const [editedContent, setEditedContent] = useState(originalContent.content)

  if (!isOpen) return null

  const handleUseSuggestion = () => {
    if (suggestedContent) {
      setEditedContent(suggestedContent)
      // Auto-apply and close
      if (type === 'post') {
        onEdit({ title: editedTitle, content: suggestedContent })
      } else {
        onEdit({ content: suggestedContent })
      }
      onClose()
    }
  }

  const handleClose = () => {
    // Return edited content to parent
    if (type === 'post') {
      onEdit({ title: editedTitle, content: editedContent })
    } else {
      onEdit({ content: editedContent })
    }
    onClose()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-red-900">
              Nội dung cần chỉnh sửa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            type="button"
          >
            <XIcon size={20} className="text-red-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reason */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Lý do từ chối:</h3>
                <p className="text-yellow-800">{reason}</p>
              </div>
            </div>
          </div>

          {/* Issues List */}
          {issues.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Các vấn đề cần sửa ({issues.length}):
              </h3>
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {issue.type === 'offensive_language' && 'Từ ngữ xúc phạm'}
                          {issue.type === 'spam' && 'Spam'}
                          {issue.type === 'discrimination' && 'Phân biệt đối xử'}
                          {issue.type === 'harassment' && 'Quấy rối'}
                          {issue.type === 'inappropriate' && 'Nội dung không phù hợp'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                          {issue.severity === 'high' && 'Nghiêm trọng'}
                          {issue.severity === 'medium' && 'Trung bình'}
                          {issue.severity === 'low' && 'Nhẹ'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Vị trí:</span> {issue.location}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Gợi ý sửa:</span> {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Content (if available) */}
          {suggestedContent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircleIcon className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Nội dung đã được đề xuất sửa đổi:
                  </h3>
                  <p className="text-green-800 whitespace-pre-wrap">{suggestedContent}</p>
                </div>
              </div>
              <button
                onClick={handleUseSuggestion}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Sử dụng nội dung đề xuất
              </button>
            </div>
          )}

          {/* Edit Form */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Chỉnh sửa nội dung:
            </h3>
            <div className="space-y-4">
              {type === 'post' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập tiêu đề..."
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Nhập nội dung..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Quay lại chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

