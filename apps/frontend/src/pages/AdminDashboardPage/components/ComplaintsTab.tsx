import React, { useState, useEffect } from 'react'
import { adminService } from '../../../services/adminService'
import type { Complaint, Report } from '../../../services/adminService'
import { XIcon } from 'lucide-react'
import { AnalysisReportDetailModal } from './AnalysisReportDetailModal'

type ComplaintOrReport = Complaint | Report

export const ComplaintsTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'complaint' | 'report' | 'pending' | 'resolved'
  >('all')
  const [selectedItem, setSelectedItem] = useState<ComplaintOrReport | null>(
    null,
  )
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [adminNotes, setAdminNotes] = useState('')
  const [statusUpdate, setStatusUpdate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch complaints and reports separately to handle errors independently
        let complaintsData: Complaint[] = []
        let reportsData: Report[] = []
        
        try {
          console.log('📋 [ComplaintsTab] Fetching complaints with filter:', activeFilter)
          const complaintsRes = await adminService.getComplaints({
            status: activeFilter === 'pending' ? 'pending' : activeFilter === 'resolved' ? 'resolved' : undefined,
            page: 1,
            limit: 100,
          })
          console.log('📋 [ComplaintsTab] Complaints response:', {
            hasData: !!complaintsRes,
            complaintsCount: complaintsRes?.complaints?.length || 0,
            complaints: complaintsRes?.complaints,
          })
          complaintsData = complaintsRes?.complaints || []
        } catch (error: any) {
          console.error('❌ [ComplaintsTab] Error fetching complaints:', error)
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
          })
          console.error('Full error response:', JSON.stringify(error.response?.data, null, 2))
          if (error.response?.status === 401) {
            // Unauthorized - might need to refresh token
            console.warn('Unauthorized access to complaints')
          }
        }
        
        try {
          console.log('📋 [ComplaintsTab] Fetching reports with filter:', activeFilter)
          const reportsRes = await adminService.getReports({
            status: activeFilter === 'pending' ? 'pending' : activeFilter === 'resolved' ? 'resolved' : undefined,
            page: 1,
            limit: 100,
          })
          console.log('📋 [ComplaintsTab] Reports response:', {
            hasData: !!reportsRes,
            reportsCount: reportsRes?.reports?.length || 0,
            reports: reportsRes?.reports,
          })
          reportsData = reportsRes?.reports || []
        } catch (error: any) {
          console.error('❌ [ComplaintsTab] Error fetching reports:', error)
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
          })
          console.error('Full error response:', JSON.stringify(error.response?.data, null, 2))
          if (error.response?.status === 401) {
            // Unauthorized - might need to refresh token
            console.warn('Unauthorized access to reports')
          }
        }
        
        setComplaints(complaintsData)
        setReports(reportsData)
      } catch (error: any) {
        console.error('Unexpected error:', error)
        setComplaints([])
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeFilter])

  const allItems: ComplaintOrReport[] = [
    ...complaints.map((c) => ({ ...c, itemType: 'complaint' as const })),
    ...reports.map((r) => ({ ...r, itemType: 'report' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  console.log('📋 [ComplaintsTab] Data state:', {
    complaintsCount: complaints.length,
    reportsCount: reports.length,
    allItemsCount: allItems.length,
    activeFilter,
  })

  const filteredItems = allItems.filter((item) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'complaint') return 'itemType' in item && item.itemType === 'complaint'
    if (activeFilter === 'report') return 'itemType' in item && item.itemType === 'report'
    return item.status === activeFilter
  })

  console.log('📋 [ComplaintsTab] Filtered items:', {
    count: filteredItems.length,
    items: filteredItems.map(item => ({
      id: item._id,
      type: 'itemType' in item ? item.itemType : 'unknown',
      status: item.status,
      title: 'title' in item ? item.title : 'report',
    })),
  })

  const filters = [
    {
      id: 'all',
      label: 'Tất cả',
      count: allItems.length,
    },
    {
      id: 'complaint',
      label: 'Khiếu nại',
      count: complaints.length,
    },
    {
      id: 'report',
      label: 'Báo cáo',
      count: reports.length,
    },
    {
      id: 'pending',
      label: 'Chờ xử lý',
      count: allItems.filter((item) => item.status === 'pending').length,
    },
    {
      id: 'resolved',
      label: 'Đã xử lý',
      count: allItems.filter((item) => item.status === 'resolved' || item.status === 'dismissed').length,
    },
  ]

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
      dismissed: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: 'Bỏ qua',
      },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    )
  }

  const isComplaint = (item: ComplaintOrReport): item is Complaint => {
    // Check if it's a complaint by looking for complaint-specific fields
    if ('itemType' in item && item.itemType === 'complaint') return true
    
    // Reports have targetType and targetId fields, complaints don't
    // This is the most reliable way to distinguish them
    if ('targetType' in item && 'targetId' in item) {
      return false // This is definitely a report
    }
    
    // Complaints have title field, reports don't
    if ('title' in item) {
      return true // This is definitely a complaint
    }
    
    // Check by type field - but be careful: both complaints and reports can have type: 'analysis'
    // So we need to check other fields first (which we did above)
    if ('type' in item) {
      const complaintTypes = ['analysis', 'chatbot', 'my-plants', 'map', 'general']
      const itemType = (item as any).type as string
      // Only return true if it's a complaint type AND doesn't have report fields
      return complaintTypes.includes(itemType) && !('targetType' in item)
    }
    
    // Default: if no clear indicators, assume it's a complaint (safer fallback)
    return 'title' in item
  }

  const handleStatusUpdate = async () => {
    if (!selectedItem || !statusUpdate) return

    try {
      if (isComplaint(selectedItem)) {
        await adminService.updateComplaintStatus(selectedItem._id, {
          status: statusUpdate,
          adminNotes: adminNotes || undefined,
        })
      } else {
        await adminService.updateReportStatus(selectedItem._id, {
          status: statusUpdate,
          adminNotes: adminNotes || undefined,
        })
      }
      // Refresh data
      const [complaintsRes, reportsRes] = await Promise.all([
        adminService.getComplaints({
          page: 1,
          limit: 100,
        }),
        adminService.getReports({
          page: 1,
          limit: 100,
        }),
      ])
      setComplaints(complaintsRes?.complaints || [])
      setReports(reportsRes?.reports || [])
      setShowDetailModal(false)
      setSelectedItem(null)
      setAdminNotes('')
      setStatusUpdate('')
    } catch (error: any) {
      console.error('Error updating status:', error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    }
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

      {/* Items List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg mb-2">
            {activeFilter === 'all' 
              ? 'Chưa có khiếu nại hoặc báo cáo nào' 
              : activeFilter === 'complaint'
              ? 'Chưa có khiếu nại nào'
              : activeFilter === 'report'
              ? 'Chưa có báo cáo nào'
              : `Chưa có mục nào với trạng thái "${activeFilter}"`}
          </p>
          <p className="text-sm text-gray-400">
            Tổng số: {allItems.length} mục ({complaints.length} khiếu nại, {reports.length} báo cáo)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isComplaintItem = isComplaint(item)
            return (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-green-300 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedItem(item)
                  setAdminNotes(item.adminNotes || '')
                  setStatusUpdate(item.status)
                  setShowDetailModal(true)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.user.profileImage ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.email}`
                      }
                      alt={item.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${isComplaintItem ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {isComplaintItem ? '📋 Khiếu nại' : '🚩 Báo cáo'}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.user.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">
                  {isComplaintItem ? (item as Complaint).title : `Báo cáo ${(item as Report).reason}`}
                </h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {isComplaintItem ? (item as Complaint).description : (item as Report).description || 'Không có mô tả'}
                </p>

                {isComplaintItem && (item as Complaint).relatedId && (
                  <div className="text-sm text-green-600 hover:text-green-700">
                    Liên quan: {(item as Complaint).relatedType} #{(item as Complaint).relatedId} →
                  </div>
                )}
                {!isComplaintItem && (
                  <div className="text-sm text-green-600 hover:text-green-700">
                    Đối tượng: {(item as Report).targetType} #{(item as Report).targetId} →
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal - Show AnalysisReportDetailModal for analysis reports */}
      {showDetailModal && selectedItem && (() => {
        // Check if this is an analysis report
        const item = selectedItem
        const hasTargetType = 'targetType' in item
        const hasTargetId = 'targetId' in item
        const isReport = hasTargetType && hasTargetId && !isComplaint(item)
        const isAnalysisReport = isReport && 
          (item as Report).type === 'analysis' && 
          (item as Report).targetType === 'analysis'
        
        if (isAnalysisReport) {
          return (
            <AnalysisReportDetailModal
              report={item as Report}
              isOpen={showDetailModal}
              onClose={() => {
                setShowDetailModal(false)
                setSelectedItem(null)
                setAdminNotes('')
                setStatusUpdate('')
              }}
              onStatusUpdate={async (reportId: string, status: string, notes?: string) => {
                await adminService.updateReportStatus(reportId, {
                  status: status as any,
                  adminNotes: notes,
                })
                // Refresh data
                const [complaintsRes, reportsRes] = await Promise.all([
                  adminService.getComplaints({
                    page: 1,
                    limit: 100,
                  }),
                  adminService.getReports({
                    page: 1,
                    limit: 100,
                  }),
                ])
                setComplaints(complaintsRes?.complaints || [])
                setReports(reportsRes?.reports || [])
              }}
            />
          )
        }
        
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Chi tiết{' '}
                {isComplaint(selectedItem) ? 'khiếu nại' : 'báo cáo'}
              </h3>
              <button onClick={() => setShowDetailModal(false)}>
                <XIcon size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedItem.user.profileImage ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.user.email}`
                  }
                  alt={selectedItem.user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedItem.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Status & Type */}
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${isComplaint(selectedItem) ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}
                >
                  {isComplaint(selectedItem) ? '📋 Khiếu nại' : '🚩 Báo cáo'}
                </span>
                {getStatusBadge(selectedItem.status)}
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {isComplaint(selectedItem) ? (selectedItem as Complaint).title : `Báo cáo: ${(selectedItem as Report).reason}`}
                </h4>
                <p className="text-gray-700">
                  {isComplaint(selectedItem)
                    ? (selectedItem as Complaint).description
                    : (selectedItem as Report).description || 'Không có mô tả'}
                </p>
              </div>

              {/* Related Item */}
              {isComplaint(selectedItem) && (selectedItem as Complaint).relatedId && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Liên quan đến:
                  </div>
                  <div className="text-green-600 hover:text-green-700 cursor-pointer">
                    {(selectedItem as Complaint).relatedType} #{(selectedItem as Complaint).relatedId} →
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú của Admin
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
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
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="reviewing">Đang xem xét</option>
                  {isComplaint(selectedItem) ? (
                    <>
                      <option value="resolved">Đã xử lý</option>
                      <option value="rejected">Từ chối</option>
                    </>
                  ) : (
                    <>
                      <option value="resolved">Đã xử lý</option>
                      <option value="dismissed">Bỏ qua</option>
                    </>
                  )}
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
                <button
                  onClick={() => {
                    if (isComplaint(selectedItem)) {
                      setStatusUpdate('rejected')
                    } else {
                      setStatusUpdate('dismissed')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {isComplaint(selectedItem) ? 'Từ chối' : 'Bỏ qua'}
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
