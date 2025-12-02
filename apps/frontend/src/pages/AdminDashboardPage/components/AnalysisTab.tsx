import React from 'react'
import { StatCard } from './StatCard'
export const AnalysisTab: React.FC = () => {
  const stats = [
    {
      title: 'Người dùng hôm nay',
      value: 123,
      icon: 'users',
      color: 'blue' as const,
      trend: {
        value: 12,
        direction: 'up' as const,
      },
    },
    {
      title: 'Phân tích hôm nay',
      value: 456,
      icon: 'chart',
      color: 'green' as const,
      trend: {
        value: 8,
        direction: 'up' as const,
      },
    },
    {
      title: 'Khiếu nại chờ xử lý',
      value: 5,
      icon: 'alert',
      color: 'orange' as const,
    },
  ]
  const topDiseases = [
    {
      name: 'Bệnh nấm',
      count: 45,
    },
    {
      name: 'Bệnh đốm lá',
      count: 32,
    },
    {
      name: 'Bệnh rỉ sắt',
      count: 28,
    },
    {
      name: 'Bệnh héo xanh',
      count: 21,
    },
    {
      name: 'Bệnh thán thư',
      count: 18,
    },
  ]
  const topPlants = [
    {
      name: 'Lúa',
      count: 120,
    },
    {
      name: 'Ngô',
      count: 89,
    },
    {
      name: 'Cà chua',
      count: 67,
    },
    {
      name: 'Xoài',
      count: 54,
    },
    {
      name: 'Ớt',
      count: 43,
    },
  ]
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} data={stat} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lượt phân tích theo ngày (7 ngày)
        </h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">
            📊 Chart placeholder - Daily Analysis Usage
          </p>
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Diseases */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🦠 Bệnh phổ biến nhất
          </h3>
          <div className="space-y-3">
            {topDiseases.map((disease, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">
                    {disease.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {disease.count} lượt
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Plants */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🌱 Cây trồng phổ biến nhất
          </h3>
          <div className="space-y-3">
            {topPlants.map((plant, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">
                    {plant.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {plant.count} lượt
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
