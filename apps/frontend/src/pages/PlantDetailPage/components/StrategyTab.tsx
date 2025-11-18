import React, { useState } from 'react'
import {
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
} from 'lucide-react'
import type { CareStrategy } from '../../MyPlantsPage/types/plantBox.types'
interface StrategyTabProps {
  strategy: CareStrategy | null
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  onToggleAction: (dayIndex: number, actionId: string) => void
}
export const StrategyTab: React.FC<StrategyTabProps> = ({
  strategy,
  loading,
  refreshing,
  onRefresh,
  onToggleAction,
}) => {
  const [expandedDays, setExpandedDays] = useState<number[]>([0])
  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((i) => i !== dayIndex)
        : [...prev, dayIndex],
    )
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCwIcon className="animate-spin text-green-600" size={32} />
      </div>
    )
  }
  if (!strategy) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Chưa có chiến lược chăm sóc
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Tạo chiến lược dựa trên thời tiết và thông tin cây
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCwIcon size={16} />
          <span className="text-base font-medium">Tạo chiến lược</span>
        </button>
      </div>
    )
  }
  const formatDate = (dateString: string, dayIndex: number) => {
    if (dayIndex === 0) return 'Hôm nay'
    if (dayIndex === 1) return 'Ngày mai'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      watering: '💧',
      fertilizing: '🌱',
      pruning: '✂️',
      inspection: '🔍',
      protection: '🛡️',
      other: '📝',
    }
    return icons[type] || '📝'
  }
  return (
    <div className="space-y-4 relative">
      {/* Loading Overlay */}
      {refreshing && (
        <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg min-h-[400px]">
          <div className="flex flex-col items-center">
            <RefreshCwIcon className="animate-spin text-green-600 mb-4" size={48} />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Đang tạo chiến lược chăm sóc...
            </p>
            <p className="text-sm text-gray-600 text-center max-w-md px-4">
              Hệ thống đang phân tích thời tiết và tạo chiến lược chăm sóc tối ưu cho 7 ngày tới
            </p>
            <div className="mt-4 flex gap-1">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            📅 Chiến lược chăm sóc 7 ngày
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Cập nhật lần cuối: {formatDateTime(strategy.lastUpdated)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCwIcon
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          <span>{refreshing ? 'Đang cập nhật...' : 'Cập nhật'}</span>
        </button>
      </div>

      {/* Days */}
      {strategy.next7Days.map((day, dayIndex) => {
        const isExpanded = expandedDays.includes(dayIndex)
        const isToday = dayIndex === 0
        return (
          <div
            key={dayIndex}
            className={`border rounded-xl overflow-hidden ${isToday ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
          >
            {/* Day Header */}
            <button
              onClick={() => toggleDay(dayIndex)}
              className={`w-full p-5 flex items-center justify-between hover:bg-opacity-80 transition-colors ${isToday ? 'hover:bg-green-100' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDownIcon size={20} className="text-gray-600" />
                ) : (
                  <ChevronRightIcon size={20} className="text-gray-600" />
                )}
                <span className="text-base font-bold text-gray-900">
                  📅 {formatDate(day.date, dayIndex)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>
                  🌡️ {Math.round(day.weather.temp.min)}°C -{' '}
                  {Math.round(day.weather.temp.max)}°C
                </span>
                <span>💧 {Math.round(day.weather.humidity)}%</span>
                <span>🌧️ {Math.round(day.weather.rain)}mm</span>
              </div>
            </button>

            {/* Alerts */}
            {isExpanded &&
              day.weather.alerts &&
              day.weather.alerts.length > 0 && (
                <div className="px-5 pb-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangleIcon size={16} className="text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Cảnh báo: {day.weather.alerts.join(', ')}
                    </span>
                  </div>
                </div>
              )}

            {/* Actions */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-2">
                {day.actions && day.actions.length > 0 ? (
                  day.actions.map((action) => (
                    <div
                      key={action._id}
                      className={`border rounded-lg p-4 ${action.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onToggleAction(dayIndex, action._id)}
                          className="flex-shrink-0 mt-0.5"
                        >
                          {action.completed ? (
                            <CheckCircle2Icon
                              size={20}
                              className="text-green-600"
                            />
                          ) : (
                            <CircleIcon size={20} className="text-gray-300" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {getActionIcon(action.type)}
                            </span>
                            <span
                              className={`text-sm font-bold ${action.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                            >
                              {action.time} - {action.description}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            Lý do: {action.reason}
                          </p>
                          {action.products && action.products.length > 0 && (
                            <div className="space-y-1">
                              {action.products.map((product, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs text-gray-600"
                                >
                                  <span>Sản phẩm: {product.name}</span>
                                  {product.link && (
                                    <a
                                      href={product.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-700 flex items-center gap-1 underline"
                                    >
                                      <span>Mua sản phẩm</span>
                                      <ExternalLinkIcon size={10} />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                    <div className="text-4xl mb-2">🌱</div>
                    <p className="text-sm text-gray-600 font-medium">
                      {isToday
                        ? 'Hôm nay không có hành động chăm sóc nào. Hãy nghỉ ngơi và tận hưởng!'
                        : 'Không có hành động chăm sóc cho ngày này'}
                    </p>
                    {isToday && (
                      <p className="text-xs text-gray-500 mt-2">
                        Cây trồng của bạn đang trong tình trạng tốt, không cần chăm sóc thêm
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
