import React, { useState } from 'react'
import { XIcon, DownloadIcon, ExternalLinkIcon, FlagIcon } from 'lucide-react'
import type { Report } from '../../../services/adminService'

interface AnalysisReportDetailModalProps {
  report: Report
  isOpen: boolean
  onClose: () => void
  onStatusUpdate?: (reportId: string, status: string, notes?: string) => Promise<void>
}

export const AnalysisReportDetailModal: React.FC<AnalysisReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onStatusUpdate,
}) => {
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '')
  const [statusUpdate, setStatusUpdate] = useState(report.status)
  const [updating, setUpdating] = useState(false)

  if (!isOpen) return null

  const reasonLabels: Record<string, string> = {
    error: 'Lỗi',
    wrong_result: 'Kết quả sai',
    spam: 'Spam',
    inappropriate: 'Nội dung không phù hợp',
    harassment: 'Quấy rối',
    fake: 'Thông tin sai sự thật',
    other: 'Khác',
  }

  const handleTestRun = () => {
    // Open new tab with image analysis page and auto-upload original image
    if (report.originalImageUrl) {
      const analysisUrl = `/analyze?imageUrl=${encodeURIComponent(report.originalImageUrl)}`
      window.open(analysisUrl, '_blank')
    }
  }

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
      .catch((error) => {
        console.error('Failed to download image:', error)
        alert('Không thể tải hình ảnh')
      })
  }

  const handleStatusUpdate = async () => {
    if (!onStatusUpdate) return

    setUpdating(true)
    try {
      await onStatusUpdate(report._id, statusUpdate, adminNotes)
      onClose()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FlagIcon className="text-red-600" size={24} />
            <div>
              <h3 className="text-xl font-semibold">Chi tiết báo cáo phân tích</h3>
              <p className="text-sm text-gray-500">ID: {report._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Người báo cáo</h4>
            <div className="flex items-center gap-3">
              <img
                src={
                  report.user.profileImage ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.user.email}`
                }
                alt={report.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900">{report.user.name}</p>
                <p className="text-sm text-gray-600">{report.user.email}</p>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do báo cáo</label>
              <p className="text-gray-900">{reasonLabels[report.reason] || report.reason}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  report.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : report.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : report.status === 'reviewing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {report.status === 'pending'
                  ? 'Chờ xử lý'
                  : report.status === 'resolved'
                  ? 'Đã xử lý'
                  : report.status === 'reviewing'
                  ? 'Đang xem xét'
                  : 'Đã từ chối'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
              <p className="text-gray-900">
                {new Date(report.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Analysis ID</label>
              <p className="text-gray-900 font-mono text-sm">{report.targetId}</p>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung báo cáo</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">{report.description}</p>
              </div>
            </div>
          )}

          {/* Original Image (Image used for analysis) */}
          {report.originalImageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh cây đã phân tích (Ảnh gốc)
              </label>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start gap-4">
                  <img
                    src={report.originalImageUrl}
                    alt="Original analysis image"
                    className="w-48 h-48 object-cover rounded-lg border border-blue-300"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        Đây là hình ảnh mà người dùng đã upload để phân tích cây và bệnh.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleDownloadImage(
                              report.originalImageUrl!,
                              `analysis-original-${report._id}.jpg`,
                            )
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <DownloadIcon size={18} />
                          Tải ảnh gốc
                        </button>
                        <button
                          onClick={handleTestRun}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ExternalLinkIcon size={18} />
                          Chạy thử
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Images (Images showing errors/issues) */}
          {report.images && report.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh minh chứng lỗi/vấn đề ({report.images.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {report.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Error evidence ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() =>
                        handleDownloadImage(imageUrl, `error-evidence-${report._id}-${index + 1}.jpg`)
                      }
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                    >
                      <DownloadIcon className="text-white" size={24} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Cập nhật trạng thái</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái mới
                </label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="reviewing">Đang xem xét</option>
                  <option value="resolved">Đã xử lý</option>
                  <option value="dismissed">Đã từ chối</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú của admin
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{adminNotes.length}/1000 ký tự</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              {onStatusUpdate && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

