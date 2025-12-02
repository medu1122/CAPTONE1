import React, { useState, useEffect } from 'react'
import { StatCard } from './StatCard'
import { LineChart } from './LineChart'
import { PieChart } from './PieChart'
import { adminService } from '../../../services/adminService'
import type { AnalysisStats } from '../../../services/adminService'

export const AnalysisTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AnalysisStats | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const data = await adminService.getAnalysisStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching analysis stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = stats
    ? [
        {
          title: 'Người dùng hôm nay',
          value: stats.usersToday,
          icon: 'users',
          color: 'blue' as const,
        },
        {
          title: 'Phân tích hôm nay',
          value: stats.analysesToday,
          icon: 'chart',
          color: 'green' as const,
        },
        {
          title: 'Khiếu nại chờ xử lý',
          value: stats.pendingComplaints,
          icon: 'alert',
          color: 'orange' as const,
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lượt phân tích theo ngày (7 ngày)
        </h3>
        {stats && stats.chartData?.dailyUsage && stats.chartData.dailyUsage.length > 0 ? (
          <LineChart
            data={stats.chartData.dailyUsage.map((item: { _id: string; count: number }) => ({
              date: item._id,
              value: item.count || 0,
            }))}
            color="#10b981"
            height={300}
            yAxisLabel="Số lượt phân tích"
          />
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">Chưa có dữ liệu</p>
          </div>
        )}
      </div>

      {/* Top Lists with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Diseases */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🦠 Bệnh phổ biến nhất
          </h3>
          {stats && stats.topDiseases.length > 0 ? (
            <>
              <div className="mb-4">
                <PieChart
                  data={stats.topDiseases.slice(0, 10).map((disease) => ({
                    name: disease.name || 'Không xác định',
                    value: disease.count || 0,
                  }))}
                  colors={['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']}
                  height={250}
                />
              </div>
              <div className="space-y-2">
                {stats.topDiseases.slice(0, 5).map((disease, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {disease.name || 'Không xác định'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {disease.count} lượt
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Chưa có dữ liệu về bệnh
            </p>
          )}
        </div>

        {/* Top Plants */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🌱 Cây trồng phổ biến nhất
          </h3>
          {stats && stats.topPlants.length > 0 ? (
            <>
              <div className="mb-4">
                <PieChart
                  data={stats.topPlants.slice(0, 10).map((plant) => ({
                    name: plant.name || 'Không xác định',
                    value: plant.count || 0,
                  }))}
                  colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']}
                  height={250}
                />
              </div>
              <div className="space-y-2">
                {stats.topPlants.slice(0, 5).map((plant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {plant.name || 'Không xác định'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {plant.count} lượt
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Chưa có dữ liệu về cây trồng
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
