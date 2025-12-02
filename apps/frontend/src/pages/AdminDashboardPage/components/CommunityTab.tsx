import React, { useState, useEffect } from 'react'
import { StatCard } from './StatCard'
import { LineChart } from './LineChart'
import { MultiLineChart } from './MultiLineChart'
import { adminService } from '../../../services/adminService'
import type { CommunityStats } from '../../../services/adminService'

export const CommunityTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CommunityStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const data = await adminService.getCommunityStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching community stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = stats
    ? [
        {
          title: 'Bài viết hôm nay',
          value: stats.postsToday,
          icon: 'post',
          color: 'blue' as const,
        },
        {
          title: 'Lượt thích hôm nay',
          value: stats.likesToday,
          icon: 'heart',
          color: 'red' as const,
        },
        {
          title: 'Bình luận hôm nay',
          value: stats.commentsToday,
          icon: 'message',
          color: 'green' as const,
        },
        {
          title: 'Báo cáo chờ xử lý',
          value: stats.pendingReports,
          icon: 'flag',
          color: 'orange' as const,
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-pulse"
            >
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Posts Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê số lượng bài viết (7 ngày)
          </h3>
          {stats && stats.chartData?.postsTrend && stats.chartData.postsTrend.length > 0 ? (
            <LineChart
              data={stats.chartData.postsTrend.map((item: { _id: string; count: number }) => ({
                date: item._id,
                value: item.count || 0,
              }))}
              color="#3b82f6"
              height={300}
              yAxisLabel="Số bài viết"
            />
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Interactions Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê số lượng tương tác (Like + Comment) (7 ngày)
          </h3>
          {stats && stats.chartData?.interactionsTrend && stats.chartData.interactionsTrend.length > 0 ? (
            <LineChart
              data={stats.chartData.interactionsTrend.map((item: { _id: string; count: number }) => ({
                date: item._id,
                value: item.count || 0,
              }))}
              color="#10b981"
              height={300}
              yAxisLabel="Số tương tác"
            />
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Reports Trend Chart - Multiple Lines */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê số lượng báo cáo (7 ngày)
          </h3>
          {stats && stats.chartData?.reportsTrend && 
           (stats.chartData.reportsTrend.pending?.length > 0 || stats.chartData.reportsTrend.resolved?.length > 0) ? (
            <MultiLineChart
              data={[]}
              lines={[
                {
                  key: 'pending',
                  name: 'Đang xử lý',
                  color: '#ef4444',
                  data: (stats.chartData.reportsTrend.pending || []).map((item: { _id: string; count: number }) => ({
                    date: item._id,
                    value: item.count || 0,
                  })),
                },
                {
                  key: 'resolved',
                  name: 'Đã xử lý',
                  color: '#10b981',
                  data: (stats.chartData.reportsTrend.resolved || []).map((item: { _id: string; count: number }) => ({
                    date: item._id,
                    value: item.count || 0,
                  })),
                },
              ]}
              height={300}
              yAxisLabel="Số báo cáo"
            />
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Liked */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ❤️ Được thích nhiều nhất hôm nay
          </h3>
          {stats && stats.topPosts.mostLiked.length > 0 ? (
            <div className="space-y-4">
              {stats.topPosts.mostLiked.map((post) => (
                <div
                  key={post.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={
                        post.author.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`
                      }
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
          ) : (
            <p className="text-gray-500 text-center py-8">
              Chưa có bài viết nào hôm nay
            </p>
          )}
        </div>

        {/* Most Commented */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💬 Được bình luận nhiều nhất hôm nay
          </h3>
          {stats && stats.topPosts.mostCommented.length > 0 ? (
            <div className="space-y-4">
              {stats.topPosts.mostCommented.map((post) => (
                <div
                  key={post.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={
                        post.author.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`
                      }
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
          ) : (
            <p className="text-gray-500 text-center py-8">
              Chưa có bài viết nào hôm nay
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
