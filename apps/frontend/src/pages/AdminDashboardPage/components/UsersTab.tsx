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
  const [blockDuration, setBlockDuration] = useState('')
  const [muteDuration, setMuteDuration] = useState('')
  const [muteReason, setMuteReason] = useState('')
  const [showMuteModal, setShowMuteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileUser, setProfileUser] = useState<User | null>(null)

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
    
    // Không cho phép chặn/mute admin
    if (selectedUser.role === 'admin') {
      alert('Không thể chặn hoặc mute người dùng có vai trò Admin')
      return
    }
    
    try {
      if (selectedUser.status === 'active') {
        await adminService.blockUser(selectedUser._id, {
          reason: blockReason,
          duration: blockDuration ? parseInt(blockDuration) : undefined,
        })
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
      setBlockDuration('')
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Có lỗi xảy ra khi chặn/bỏ chặn người dùng')
    }
  }

  const handleMute = async () => {
    if (!selectedUser) return
    
    // Không cho phép chặn/mute admin
    if (selectedUser.role === 'admin') {
      alert('Không thể chặn hoặc mute người dùng có vai trò Admin')
      return
    }
    
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
      alert('Có lỗi xảy ra khi mute người dùng')
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
      alert('Có lỗi xảy ra khi bỏ mute người dùng')
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
                              🔇 Muted
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
                            <button
                              onClick={() => {
                                setProfileUser(user)
                                setShowProfileModal(true)
                                setShowActionMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                            >
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
                                disabled={user.role === 'admin'}
                              >
                                Unmute
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (user.role === 'admin') {
                                    alert('Không thể mute người dùng có vai trò Admin')
                                    setShowActionMenu(null)
                                    return
                                  }
                                  setSelectedUser(user)
                                  setShowMuteModal(true)
                                  setShowActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                Mute
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
            {selectedUser.role === 'admin' ? (
              <p className="text-red-600 mb-4">
                ⚠️ Không thể chặn người dùng có vai trò Admin
              </p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Bạn có chắc muốn{' '}
                  {selectedUser.status === 'active' ? 'chặn' : 'bỏ chặn'} người dùng{' '}
                  <strong>{selectedUser.name}</strong>?
                </p>
                {selectedUser.status === 'active' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian (giờ) - để trống = vĩnh viễn
                      </label>
                      <input
                        type="number"
                        value={blockDuration}
                        onChange={(e) => setBlockDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ví dụ: 24, 72, 168..."
                      />
                    </div>
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
                  </>
                )}
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              {selectedUser.role !== 'admin' && (
                <button
                  onClick={handleBlock}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mute Modal */}
      {showMuteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mute người dùng</h3>
              <button onClick={() => setShowMuteModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            {selectedUser.role === 'admin' ? (
              <p className="text-red-600 mb-4">
                ⚠️ Không thể mute người dùng có vai trò Admin
              </p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Mute người dùng <strong>{selectedUser.name}</strong>. Người dùng sẽ không thể đăng bài hoặc bình luận.
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
                    placeholder="Ví dụ: 24, 72, 168..."
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
                    placeholder="Nhập lý do mute..."
                  />
                </div>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMuteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              {selectedUser.role !== 'admin' && (
                <button
                  onClick={handleMute}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && profileUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Hồ sơ người dùng</h3>
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  setProfileUser(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      profileUser.profileImage ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.email}`
                    }
                    alt={profileUser.name}
                    className="w-24 h-24 rounded-full border-4 border-gray-100"
                  />
                  {profileUser.online && (
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900">{profileUser.name}</h4>
                  <p className="text-gray-600 mt-1">{profileUser.email}</p>
                  {profileUser.phone && (
                    <p className="text-gray-600 mt-1">📞 {profileUser.phone}</p>
                  )}
                  {profileUser.bio && (
                    <p className="text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">{profileUser.bio}</p>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    profileUser.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {profileUser.status === 'active' ? '✓ Hoạt động' : '✗ Đã chặn'}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    profileUser.isVerified
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {profileUser.isVerified ? '✓ Đã xác thực' : 'Chưa xác thực'}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    profileUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {profileUser.role === 'admin' ? '👑 Admin' : 'User'}
                </span>
                {profileUser.mutedUntil && new Date(profileUser.mutedUntil) > new Date() && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">
                    🔇 Muted
                  </span>
                )}
              </div>

              {/* Mute/Block Info */}
              {profileUser.mutedUntil && new Date(profileUser.mutedUntil) > new Date() && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Thông tin Mute</h5>
                  <p className="text-sm text-yellow-700">
                    <strong>Muted đến:</strong>{' '}
                    {new Date(profileUser.mutedUntil).toLocaleString('vi-VN')}
                  </p>
                  {profileUser.muteReason && (
                    <p className="text-sm text-yellow-700 mt-1">
                      <strong>Lý do:</strong> {profileUser.muteReason}
                    </p>
                  )}
                </div>
              )}

              {profileUser.status === 'blocked' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-semibold text-red-800 mb-2">🚫 Thông tin chặn</h5>
                  {profileUser.blockedUntil && (
                    <p className="text-sm text-red-700">
                      <strong>Chặn đến:</strong>{' '}
                      {new Date(profileUser.blockedUntil).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {profileUser.blockReason && (
                    <p className="text-sm text-red-700 mt-1">
                      <strong>Lý do:</strong> {profileUser.blockReason}
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              {profileUser.location && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">📍 Địa chỉ</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    {profileUser.location.address && (
                      <p>
                        <strong>Địa chỉ:</strong> {profileUser.location.address}
                      </p>
                    )}
                    {profileUser.location.city && (
                      <p>
                        <strong>Thành phố:</strong> {profileUser.location.city}
                      </p>
                    )}
                    {profileUser.location.province && (
                      <p>
                        <strong>Tỉnh:</strong> {profileUser.location.province}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {profileUser.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {profileUser.stats.totalPosts || 0}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">Bài viết</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {profileUser.stats.totalComments || 0}
                    </p>
                    <p className="text-sm text-green-700 mt-1">Bình luận</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-pink-600">
                      {profileUser.stats.totalLikes || 0}
                    </p>
                    <p className="text-sm text-pink-700 mt-1">Lượt thích</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {profileUser.stats.totalPlants || 0}
                    </p>
                    <p className="text-sm text-purple-700 mt-1">Cây trồng</p>
                  </div>
                </div>
              )}

              {/* Settings */}
              {profileUser.settings && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">⚙️ Cài đặt</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Ngôn ngữ:</p>
                      <p className="font-medium text-gray-900">
                        {profileUser.settings.language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Giao diện:</p>
                      <p className="font-medium text-gray-900">
                        {profileUser.settings.theme === 'light' ? '☀️ Sáng' : '🌙 Tối'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Hiển thị hồ sơ:</p>
                      <p className="font-medium text-gray-900">
                        {profileUser.settings.privacy?.profileVisibility === 'public'
                          ? '🌐 Công khai'
                          : profileUser.settings.privacy?.profileVisibility === 'private'
                          ? '🔒 Riêng tư'
                          : '👥 Bạn bè'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Thông báo email:</p>
                      <p className="font-medium text-gray-900">
                        {profileUser.settings.emailNotifications ? '✓ Bật' : '✗ Tắt'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">Ngày tham gia</p>
                  <p>{new Date(profileUser.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cập nhật lần cuối</p>
                  <p>{new Date(profileUser.updatedAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  setProfileUser(null)
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
