// StatsCards component
// Add your code here

import React from 'react'
import { SproutIcon, LeafIcon, CalendarIcon } from 'lucide-react'
interface StatsCardsProps {
  totalCount: number
  activeCount: number
  plannedCount: number
}
export const StatsCards: React.FC<StatsCardsProps> = ({
  totalCount,
  activeCount,
  plannedCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <SproutIcon size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <LeafIcon size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Đang trồng</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <CalendarIcon size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Dự định</p>
            <p className="text-2xl font-bold text-gray-900">{plannedCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
