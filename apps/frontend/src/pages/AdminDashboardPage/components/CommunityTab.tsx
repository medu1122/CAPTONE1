import React from 'react'
import { StatCard } from './StatCard'
import { Post } from '../types/admin.types'
const mockTopPosts: Post[] = [
  {
    id: '1',
    author: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=post1',
      name: 'Nguyễn Văn A',
    },
    title: 'Cách chăm sóc cây lúa trong mùa mưa',
    likes: 234,
    comments: 45,
  },
  {
    id: '2',
    author: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=post2',
      name: 'Trần Thị B',
    },
    title: 'Kinh nghiệm trồng cà chua sạch',
    likes: 189,
    comments: 67,
  },
  {
    id: '3',
    author: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=post3',
      name: 'Lê Văn C',
    },
    title: 'Phòng trừ sâu bệnh hại tự nhiên',
    likes: 156,
    comments: 34,
  },
]
export const CommunityTab: React.FC = () => {
  const stats = [
    {
      title: 'Bài viết hôm nay',
      value: 45,
      icon: 'post',
      color: 'blue' as const,
      trend: {
        value: 15,
        direction: 'up' as const,
      },
    },
    {
      title: 'Lượt thích hôm nay',
      value: 234,
      icon: 'heart',
      color: 'red' as const,
      trend: {
        value: 8,
        direction: 'up' as const,
      },
    },
    {
      title: 'Bình luận hôm nay',
      value: 89,
      icon: 'message',
      color: 'green' as const,
      trend: {
        value: 12,
        direction: 'up' as const,
      },
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: 12,
      icon: 'flag',
      color: 'orange' as const,
    },
  ]
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Xu hướng báo cáo (7 ngày)
        </h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">📈 Chart placeholder - Reports Trend</p>
        </div>
      </div>

      {/* Top Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Liked */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ❤️ Được thích nhiều nhất hôm nay
          </h3>
          <div className="space-y-4">
            {mockTopPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {post.author.name}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Commented */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💬 Được bình luận nhiều nhất hôm nay
          </h3>
          <div className="space-y-4">
            {mockTopPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {post.author.name}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
