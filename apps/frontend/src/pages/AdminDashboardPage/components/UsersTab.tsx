import React, { useState } from 'react'
import { StatCard } from './StatCard'
import { User } from '../types/admin.types'
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  MoreVerticalIcon,
  XIcon,
} from 'lucide-react'
const mockUsers: User[] = [
  {
    id: '1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    status: 'active',
    verified: true,
    role: 'user',
    joinedDate: '2024-01-15',
    online: true,
  },
  {
    id: '2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    status: 'active',
    verified: true,
    role: 'admin',
    joinedDate: '2024-01-10',
    online: false,
  },
  {
    id: '3',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    name: 'Lê Văn C',
    email: 'levanc@example.com',
    status: 'active',
    verified: false,
    role: 'user',
    joinedDate: '2024-02-01',
    online: true,
  },
  {
    id: '4',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    name: 'Phạm Thị D',
    email: 'phamthid@example.com',
    status: 'blocked',
    verified: true,
    role: 'user',
    joinedDate: '2024-01-20',
    online: false,
  },
]
export const UsersTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const stats = [
    {
      title: 'Tổng số người dùng',
      value: 1234,
      icon: 'users',
      color: 'blue' as const,
      trend: {
        value: 5,
        direction: 'up' as const,
      },
      subtext: 'So với tháng trước',
    },
    {
      title: 'Đang online',
      value: 456,
      icon: 'activity',
      color: 'green' as const,
      subtext: 'Trong 15 phút qua',
    },
    {
      title: 'Chưa xác thực',
      value: 78,
      icon: 'mail',
      color: 'orange' as const,
      action: {
        label: 'Gửi email nhắc',
        onClick: () => alert('Sending reminder emails...'),
      },
    },
    {
      title: 'Đã chặn',
      value: 12,
      icon: 'shield',
      color: 'red' as const,
      action: {
        label: 'Xem chi tiết',
        onClick: () => alert('View blocked users...'),
      },
    },
  ]
  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tăng trưởng người dùng
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg">
              7 ngày
            </button>
            <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              30 ngày
            </button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">📈 Chart placeholder - User Growth</p>
        </div>
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
                  key={user.id}
                  className="hover:bg-green-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
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
                        className={`px-2 py-1 text-xs font-medium rounded-full ${user.verified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
                      >
                        {user.verified ? '✓ Đã xác thực' : 'Chưa xác thực'}
                      </span>
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
                    {new Date(user.joinedDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowActionMenu(
                            showActionMenu === user.id ? null : user.id,
                          )
                        }
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVerticalIcon size={20} className="text-gray-600" />
                      </button>
                      {showActionMenu === user.id && (
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
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                            Tắt tiếng
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị 1-{filteredUsers.length} trong tổng số {mockUsers.length}{' '}
            người dùng
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 bg-green-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
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
                onClick={() => {
                  alert(
                    `${selectedUser.status === 'active' ? 'Blocked' : 'Unblocked'} user: ${selectedUser.name}`,
                  )
                  setShowBlockModal(false)
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
