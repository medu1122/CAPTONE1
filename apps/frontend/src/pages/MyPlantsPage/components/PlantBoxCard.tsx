// PlantBoxCard component
// Add your code here

import React from 'react'
import {
  MapPinIcon,
  CalendarIcon,
  SproutIcon,
  HeartIcon,
  TrendingUpIcon,
} from 'lucide-react'
import type { PlantBox } from '../types/plantBox.types'
import { useNavigate } from 'react-router-dom'
interface PlantBoxCardProps {
  box: PlantBox
}
export const PlantBoxCard: React.FC<PlantBoxCardProps> = ({ box }) => {
  const navigate = useNavigate()
  const getTypeBadge = () => {
    return box.type === 'active'
      ? {
          text: 'Đang trồng',
          bg: 'bg-green-100',
          color: 'text-green-700',
        }
      : {
          text: 'Dự định',
          bg: 'bg-blue-100',
          color: 'text-blue-700',
        }
  }
  const getHealthBadge = () => {
    const badges = {
      excellent: {
        text: '🟢 Tốt',
        color: 'text-green-600',
      },
      good: {
        text: '🟢 Khá tốt',
        color: 'text-green-600',
      },
      fair: {
        text: '🟡 Trung bình',
        color: 'text-yellow-600',
      },
      poor: {
        text: '🟠 Yếu',
        color: 'text-orange-600',
      },
      critical: {
        text: '🔴 Nguy hiểm',
        color: 'text-red-600',
      },
    }
    return box.currentHealth ? badges[box.currentHealth] : null
  }
  const getGrowthStage = () => {
    const stages = {
      seed: '🌱 Hạt giống',
      seedling: '🌱 Cây con',
      vegetative: '🌿 Sinh trưởng',
      flowering: '🌸 Ra hoa',
      fruiting: '🍅 Kết trái',
      harvest: '🌾 Thu hoạch',
    }
    return box.growthStage ? stages[box.growthStage] : null
  }
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  const typeBadge = getTypeBadge()
  const healthBadge = getHealthBadge()
  const growthStage = getGrowthStage()
  return (
    <div
      onClick={() => navigate(`/my-plants/${box._id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100">
        {box.images && box.images.length > 0 ? (
          <img
            src={box.images[0].url}
            alt={box.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <SproutIcon size={48} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`${typeBadge.bg} ${typeBadge.color} px-3 py-1 rounded-full text-xs font-medium`}
          >
            {typeBadge.text}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">🌱 {box.name}</h3>
        {box.scientificName && (
          <p className="text-sm italic text-gray-600 mb-3">
            {box.scientificName}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <MapPinIcon size={14} />
            <span>Vị trí: {box.location.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} />
            <span>
              {box.type === 'active' ? 'Trồng' : 'Dự định'}:{' '}
              {formatDate(box.plantedDate || box.plannedDate)}
            </span>
          </div>
        </div>

        {/* Status */}
        {box.type === 'active' && (
          <div className="border-t border-gray-100 pt-3 mb-3 space-y-2">
            {healthBadge && (
              <div className="flex items-center gap-2 text-sm">
                <HeartIcon size={14} />
                <span className={healthBadge.color}>{healthBadge.text}</span>
              </div>
            )}
            {growthStage && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUpIcon size={14} />
                <span>{growthStage}</span>
              </div>
            )}
          </div>
        )}

        {/* Strategy Info */}
        {box.type === 'active' && (
          <div className="bg-green-50 rounded-lg p-3 mb-3 text-sm">
            <div className="font-medium text-green-700 mb-1">
              📅 Chiến lược 7 ngày
            </div>
            <div className="text-green-600">✅ 3 hành động hôm nay</div>
          </div>
        )}

        {/* Action Button */}
        <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
          Xem chi tiết →
        </button>
      </div>
    </div>
  )
}
