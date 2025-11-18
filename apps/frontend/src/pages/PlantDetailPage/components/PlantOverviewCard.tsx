import React from 'react'
import { MapPinIcon, CalendarIcon, SproutIcon } from 'lucide-react'
import type { PlantBox } from '../../MyPlantsPage/types/plantBox.types'
interface PlantOverviewCardProps {
  plantBox: PlantBox
}
export const PlantOverviewCard: React.FC<PlantOverviewCardProps> = ({
  plantBox,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  const getHealthBadge = () => {
    const badges = {
      excellent: {
        text: '🟢 Tốt',
        bg: 'bg-green-100',
        color: 'text-green-700',
      },
      good: {
        text: '🟢 Khá tốt',
        bg: 'bg-green-100',
        color: 'text-green-700',
      },
      fair: {
        text: '🟡 Trung bình',
        bg: 'bg-yellow-100',
        color: 'text-yellow-700',
      },
      poor: {
        text: '🟠 Yếu',
        bg: 'bg-orange-100',
        color: 'text-orange-700',
      },
      critical: {
        text: '🔴 Nguy hiểm',
        bg: 'bg-red-100',
        color: 'text-red-700',
      },
    }
    return plantBox.currentHealth ? badges[plantBox.currentHealth] : null
  }
  const getGrowthBadge = () => {
    const stages = {
      seed: {
        text: '🌱 Hạt giống',
        bg: 'bg-gray-100',
        color: 'text-gray-700',
      },
      seedling: {
        text: '🌱 Cây con',
        bg: 'bg-blue-100',
        color: 'text-blue-700',
      },
      vegetative: {
        text: '🌿 Sinh trưởng',
        bg: 'bg-green-100',
        color: 'text-green-700',
      },
      flowering: {
        text: '🌸 Ra hoa',
        bg: 'bg-pink-100',
        color: 'text-pink-700',
      },
      fruiting: {
        text: '🍅 Kết trái',
        bg: 'bg-orange-100',
        color: 'text-orange-700',
      },
      harvest: {
        text: '🌾 Thu hoạch',
        bg: 'bg-yellow-100',
        color: 'text-yellow-700',
      },
    }
    return plantBox.growthStage ? stages[plantBox.growthStage] : null
  }
  const healthBadge = getHealthBadge()
  const growthBadge = getGrowthBadge()
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex gap-6">
        {/* Image */}
        <div className="w-[300px] h-[300px] flex-shrink-0">
          {plantBox.images && plantBox.images.length > 0 ? (
            <img
              src={plantBox.images[0].url}
              alt={plantBox.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <SproutIcon size={64} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            🌱 {plantBox.name}
          </h2>
          {plantBox.scientificName && (
            <p className="text-base italic text-gray-600 mb-4">
              {plantBox.scientificName}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPinIcon size={16} />
              <span>Vị trí: {plantBox.location.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon size={16} />
              <span>
                {plantBox.type === 'active' ? 'Trồng' : 'Dự định'}:{' '}
                {formatDate(plantBox.plantedDate || plantBox.plannedDate)}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {healthBadge && (
              <span
                className={`${healthBadge.bg} ${healthBadge.color} px-3 py-2 rounded-2xl text-xs font-medium h-8 flex items-center`}
              >
                {healthBadge.text}
              </span>
            )}
            {growthBadge && (
              <span
                className={`${growthBadge.bg} ${growthBadge.color} px-3 py-2 rounded-2xl text-xs font-medium h-8 flex items-center`}
              >
                {growthBadge.text}
              </span>
            )}
            {plantBox.quantity && (
              <span className="bg-gray-100 text-gray-700 px-3 py-2 rounded-2xl text-xs font-medium h-8 flex items-center">
                {plantBox.quantity} cây
              </span>
            )}
          </div>

          {/* Description */}
          {plantBox.specialRequirements && (
            <p className="text-sm text-gray-700 mt-4">
              {plantBox.specialRequirements}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
