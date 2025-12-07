import React from 'react'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import type { StatCardData } from '../types/admin.types'
interface StatCardProps {
  data: StatCardData
}
const iconMap: Record<string, string> = {
  users: '👥',
  activity: '📊',
  mail: '📧',
  shield: '🛡️',
  chart: '📈',
  alert: '⚠️',
  post: '📝',
  heart: '❤️',
  message: '💬',
  flag: '🚩',
  pill: '💊',
  leaf: '🌱',
  sprout: '🌾',
  database: '💾',
}
const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
}
export const StatCard: React.FC<StatCardProps> = ({ data }) => {
  const colors = colorClasses[data.color] || colorClasses.blue
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center text-2xl`}
        >
          {iconMap[data.icon] || '📊'}
        </div>
        {data.trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${data.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}
          >
            {data.trend.direction === 'up' ? (
              <TrendingUpIcon size={16} />
            ) : (
              <TrendingDownIcon size={16} />
            )}
            <span>{data.trend.value}%</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className={`text-3xl font-bold ${colors.text} mb-1`}>
          {data.value.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-gray-700">{data.title}</div>
      </div>

      {data.subtext && (
        <div className="text-xs text-gray-500 mb-3">{data.subtext}</div>
      )}

      {data.action && (
        <button
          onClick={data.action.onClick}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {data.action.label} →
        </button>
      )}
    </div>
  )
}
