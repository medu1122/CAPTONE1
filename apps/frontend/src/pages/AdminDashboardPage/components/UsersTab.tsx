import React, { useState, useEffect } from 'react'
import { StatCard } from './StatCard'
import { LineChart } from './LineChart'
import { adminService } from '../../../services/adminService'
import type { User, UserStats } from '../../../services/adminService'
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  MoreVerticalIcon,
  XIcon,
} from 'lucide-react'

export const UsersTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [blockReason, setBlockReason] = useState('')
  const [muteDuration, setMuteDuration] = useState('')
  const [muteReason, setMuteReason] = useState('')
  const [showMuteModal, setShowMuteModal] = useState(false)

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getUserStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }
    fetchStats()
  }, [])

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await adminService.getUsersList({
          search: searchQuery || undefined,
          page: pagination.page,
          limit: pagination.limit,
        })
        setUsers(response.users)
        setPagination(response.pagination)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [searchQuery, pagination.page])

  const handleBlock = async () => {
    if (!selectedUser) return
    try {
      if (selectedUser.status === 'active') {
        await adminService.blockUser(selectedUser._id, blockReason)
      } else {
        await adminService.unblockUser(selectedUser._id)
      }
      // Refresh users list
      const response = await adminService.getUsersList({
        page: pagination.page,
        limit: pagination.limit,
      })
      setUsers(response.users)
      setShowBlockModal(false)
      setSelectedUser(null)
      setBlockReason('')
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Có lỗi xảy ra khi chặn/bỏ chặn người dùng')
    }
  }

  const handleMute = async () => {
    if (!selectedUser) return
    try {
      await adminService.muteUser(selectedUser._id, {
        reason: muteReason,
        duration: muteDuration ? parseInt(muteDuration) : undefined,
      })
      // Refresh users list
      const response = await adminService.getUsersList({
        page: pagination.page,
        limit: pagination.limit,
      })
      setUsers(response.users)
      setShowMuteModal(false)
      setSelectedUser(null)
      setMuteDuration('')
      setMuteReason('')
    } catch (error) {
      console.error('Error muting user:', error)
      alert('Có lỗi xảy ra khi tắt tiếng người dùng')
    }
  }

  const handleUnmute = async (userId: string) => {
    try {
      await adminService.unmuteUser(userId)
      // Refresh users list
      const response = await adminService.getUsersList({
        page: pagination.page,
        limit: pagination.limit,
      })
      setUsers(response.users)
    } catch (error) {
      console.error('Error unmuting user:', error)
      alert('Có lỗi xảy ra khi bỏ tắt tiếng người dùng')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    try {
      await adminService.deleteUser(userId)
      // Refresh users list
      const response = await adminService.getUsersList({
        page: pagination.page,
        limit: pagination.limit,
      })
      setUsers(response.users)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Có lỗi xảy ra khi xóa người dùng')
    }
  }

  const statCards = stats
    ? [
        {
          title: 'Tổng số người dùng',
          value: stats.total,
          icon: 'users',
          color: 'blue' as const,
        },
        {
          title: 'Đang online',
          value: stats.online,
          icon: 'activity',
          color: 'green' as const,
          subtext: 'Trong 15 phút qua',
        },
        {
          title: 'Chưa xác thực',
          value: stats.unverified,
          icon: 'mail',
          color: 'orange' as const,
        },
        {
          title: 'Đã chặn',
          value: stats.blocked,
          icon: 'shield',
          color: 'red' as const,
        },
      ]
    : []

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tăng trưởng người dùng (7 ngày)
          </h3>
        </div>
        {stats && stats.chartData?.last7Days && stats.chartData.last7Days.length > 0 ? (
          <LineChart
            data={stats.chartData.last7Days.map((item: { _id: string; count: number }) => ({
              date: item._id,
              value: item.count || 0,
            }))}
            color="#3b82f6"
            height={300}
            yAxisLabel="Số người dùng"
          />
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">Chưa có dữ liệu</p>
          </div>
        )}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Table Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <FilterIcon size={20} />
              <span>Lọc</span>
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <DownloadIcon size={20} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-green-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              user.profileImage ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                            }
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          {user.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {user.status === 'active' ? 'Hoạt động' : 'Đã chặn'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${user.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
                        >
                          {user.isVerified ? '✓ Đã xác thực' : 'Chưa xác thực'}
                        </span>
                        {user.mutedUntil &&
                          new Date(user.mutedUntil) > new Date() && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                              🔇 Đã tắt tiếng
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowActionMenu(
                              showActionMenu === user._id ? null : user._id,
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVerticalIcon size={20} className="text-gray-600" />
                        </button>
                        {showActionMenu === user._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                              Xem hồ sơ
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowBlockModal(true)
                                setShowActionMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              {user.status === 'active' ? 'Chặn' : 'Bỏ chặn'}
                            </button>
                            {user.mutedUntil &&
                            new Date(user.mutedUntil) > new Date() ? (
                              <button
                                onClick={() => {
                                  handleUnmute(user._id)
                                  setShowActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                Bỏ tắt tiếng
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowMuteModal(true)
                                  setShowActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                Tắt tiếng
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleDelete(user._id)
                                setShowActionMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {pagination.page * pagination.limit - pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} trong
            tổng số {pagination.total} người dùng
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`px-3 py-1 rounded ${
                    pagination.page === page
                      ? 'bg-green-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedUser.status === 'active'
                  ? 'Chặn người dùng'
                  : 'Bỏ chặn người dùng'}
              </h3>
              <button onClick={() => setShowBlockModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Bạn có chắc muốn{' '}
              {selectedUser.status === 'active' ? 'chặn' : 'bỏ chặn'} người dùng{' '}
              <strong>{selectedUser.name}</strong>?
            </p>
            {selectedUser.status === 'active' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do (tùy chọn)
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Nhập lý do chặn..."
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mute Modal */}
      {showMuteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tắt tiếng người dùng</h3>
              <button onClick={() => setShowMuteModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Tắt tiếng người dùng <strong>{selectedUser.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian (giờ) - để trống = vĩnh viễn
              </label>
              <input
                type="number"
                value={muteDuration}
                onChange={(e) => setMuteDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ví dụ: 24"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do (tùy chọn)
              </label>
              <textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Nhập lý do tắt tiếng..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMuteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleMute}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
