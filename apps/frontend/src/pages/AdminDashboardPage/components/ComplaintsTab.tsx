import React, { useState } from 'react'
import { Complaint } from '../types/admin.types'
import { XIcon } from 'lucide-react'
const mockComplaints: Complaint[] = [
  {
    id: '1',
    type: 'complaint',
    user: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=c1',
      name: 'Nguyễn Văn A',
    },
    title: 'Kết quả phân tích không chính xác',
    description:
      'Tôi upload ảnh cây lúa nhưng hệ thống nhận diện là cây ngô. Vui lòng kiểm tra lại.',
    status: 'pending',
    date: '2024-03-15T10:30:00',
    relatedItem: 'Analysis #12345',
  },
  {
    id: '2',
    type: 'report',
    user: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=c2',
      name: 'Trần Thị B',
    },
    title: 'Báo cáo bài viết spam',
    description: 'Bài viết này chứa nội dung quảng cáo không phù hợp.',
    status: 'reviewing',
    date: '2024-03-15T09:15:00',
    relatedItem: 'Post #67890',
  },
  {
    id: '3',
    type: 'complaint',
    user: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=c3',
      name: 'Lê Văn C',
    },
    title: 'Không thể upload ảnh',
    description:
      'Tôi không thể upload ảnh lên hệ thống. Nút upload không hoạt động.',
    status: 'resolved',
    date: '2024-03-14T16:45:00',
  },
]
export const ComplaintsTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'complaint' | 'report' | 'pending' | 'resolved'
  >('all')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  )
  const [showDetailModal, setShowDetailModal] = useState(false)
  const filters = [
    {
      id: 'all',
      label: 'Tất cả',
      count: mockComplaints.length,
    },
    {
      id: 'complaint',
      label: 'Khiếu nại',
      count: mockComplaints.filter((c) => c.type === 'complaint').length,
    },
    {
      id: 'report',
      label: 'Báo cáo',
      count: mockComplaints.filter((c) => c.type === 'report').length,
    },
    {
      id: 'pending',
      label: 'Chờ xử lý',
      count: mockComplaints.filter((c) => c.status === 'pending').length,
    },
    {
      id: 'resolved',
      label: 'Đã xử lý',
      count: mockComplaints.filter((c) => c.status === 'resolved').length,
    },
  ]
  const filteredComplaints = mockComplaints.filter((complaint) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'complaint' || activeFilter === 'report') {
      return complaint.type === activeFilter
    }
    return complaint.status === activeFilter
  })
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Chờ xử lý',
      },
      reviewing: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Đang xem xét',
      },
      resolved: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Đã xử lý',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Từ chối',
      },
    }
    const badge = badges[status as keyof typeof badges]
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    )
  }
  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeFilter === filter.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-green-300 transition-all cursor-pointer"
            onClick={() => {
              setSelectedComplaint(complaint)
              setShowDetailModal(true)
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={complaint.user.avatar}
                  alt={complaint.user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${complaint.type === 'complaint' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {complaint.type === 'complaint'
                        ? '📋 Khiếu nại'
                        : '🚩 Báo cáo'}
                    </span>
                    {getStatusBadge(complaint.status)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {complaint.user.name}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(complaint.date).toLocaleString('vi-VN')}
              </span>
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">
              {complaint.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {complaint.description}
            </p>

            {complaint.relatedItem && (
              <div className="text-sm text-green-600 hover:text-green-700">
                Liên quan: {complaint.relatedItem} →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Chi tiết{' '}
                {selectedComplaint.type === 'complaint'
                  ? 'khiếu nại'
                  : 'báo cáo'}
              </h3>
              <button onClick={() => setShowDetailModal(false)}>
                <XIcon size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <img
                  src={selectedComplaint.user.avatar}
                  alt={selectedComplaint.user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedComplaint.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedComplaint.date).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Status & Type */}
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${selectedComplaint.type === 'complaint' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}
                >
                  {selectedComplaint.type === 'complaint'
                    ? '📋 Khiếu nại'
                    : '🚩 Báo cáo'}
                </span>
                {getStatusBadge(selectedComplaint.status)}
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedComplaint.title}
                </h4>
                <p className="text-gray-700">{selectedComplaint.description}</p>
              </div>

              {/* Related Item */}
              {selectedComplaint.relatedItem && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Liên quan đến:
                  </div>
                  <div className="text-green-600 hover:text-green-700 cursor-pointer">
                    {selectedComplaint.relatedItem} →
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú của Admin
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Nhập ghi chú nội bộ..."
                />
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cập nhật trạng thái
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="pending">Chờ xử lý</option>
                  <option value="reviewing">Đang xem xét</option>
                  <option value="resolved">Đã xử lý</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Từ chối
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Xử lý xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
