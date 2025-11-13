import React from 'react'
import {
  BarChart3Icon,
  MessageSquareIcon,
  HeartIcon,
  SproutIcon,
  CalendarIcon,
  ClockIcon,
} from 'lucide-react'
import type { UserProfile } from '../types'
interface StatisticsSectionProps {
  profile: UserProfile
}
export const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  profile,
}) => {
  const stats = [
    {
      label: 'Bài viết',
      value: profile.statistics.posts,
      icon: BarChart3Icon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Bình luận',
      value: profile.statistics.comments,
      icon: MessageSquareIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Lượt thích',
      value: profile.statistics.likes,
      icon: HeartIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Cây trồng',
      value: profile.statistics.plants,
      icon: SproutIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có thông tin'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Chưa có thông tin'
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    return formatDate(dateString)
  }
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3Icon className="text-green-600" size={24} />
          Thống kê hoạt động
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center"
            >
              <div className={`${stat.bgColor} p-3 rounded-full mb-3`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Account Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Thông tin tài khoản
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CalendarIcon className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày tham gia</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(profile.joinDate || profile.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ClockIcon className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hoạt động gần nhất</p>
                <p className="text-gray-900 font-medium">
                  {formatLastActive(profile.lastActiveAt || profile.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
