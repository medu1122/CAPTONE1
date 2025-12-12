import React, { useState, useRef } from 'react'
import { MapPinIcon, CalendarIcon, SproutIcon, InfoIcon, UploadIcon, XIcon } from 'lucide-react'
import type { PlantBox } from '../../MyPlantsPage/types/plantBox.types'
import { imageUploadService } from '../../../services/imageUploadService'
import { addImageToPlantBox } from '../../../services/plantBoxService'
interface PlantOverviewCardProps {
  plantBox: PlantBox
  onImageUpload?: () => void
}
export const PlantOverviewCard: React.FC<PlantOverviewCardProps> = ({
  plantBox,
  onImageUpload,
}) => {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Extract fruiting season info from careStrategy summary if available
  const getFruitingInfo = () => {
    if (!plantBox.careStrategy?.summary) return null
    const summary = plantBox.careStrategy.summary
    // Look for fruiting season keywords in summary
    if (summary.includes('mùa ra trái') || summary.includes('ra trái') || summary.includes('thu hoạch')) {
      // Extract the relevant part
      const match = summary.match(/([^.]*(?:mùa ra trái|ra trái|thu hoạch)[^.]*)/i)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  const fruitingInfo = getFruitingInfo()

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    setUploading(true)
    try {
      const uploadResult = await imageUploadService.uploadImage(file)
      
      // Add image to plant box
      await addImageToPlantBox(plantBox._id, uploadResult.url)
      
      // Refresh plant box data
      if (onImageUpload) {
        onImageUpload()
      }
      
      setPreviewUrl(null)
      alert('Upload ảnh thành công!')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert('Không thể upload ảnh: ' + (error.message || 'Lỗi không xác định'))
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const currentImageUrl = previewUrl || (plantBox.images && plantBox.images.length > 0 ? plantBox.images[0].url : null)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex gap-6">
        {/* Image */}
        <div className="w-[300px] h-[300px] flex-shrink-0 relative group">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={plantBox.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <SproutIcon size={64} className="text-gray-400" />
            </div>
          )}
          
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <span>Đang upload...</span>
                </>
              ) : (
                <>
                  <UploadIcon size={16} />
                  <span>Upload ảnh</span>
                </>
              )}
            </button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
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

          {/* Fruiting Season Info */}
          {fruitingInfo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <InfoIcon size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  {fruitingInfo}
                </p>
              </div>
            </div>
          )}

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
