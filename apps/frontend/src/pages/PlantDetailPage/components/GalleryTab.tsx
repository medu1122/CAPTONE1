import React, { useState } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import type { PlantBox } from '../../MyPlantsPage/types/plantBox.types'
interface GalleryTabProps {
  plantBox: PlantBox
}
export const GalleryTab: React.FC<GalleryTabProps> = ({ plantBox }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const images = plantBox.images || []
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })
  }
  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Chưa có ảnh nào
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Thêm ảnh để theo dõi sự phát triển của cây
        </p>
        <button className="px-6 py-3 bg-green-600 text-white text-base font-medium rounded-lg hover:bg-green-700 transition-colors">
          Thêm ảnh đầu tiên
        </button>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">🖼️ Gallery</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
          <PlusIcon size={16} />
          <span>Thêm ảnh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image._id}
            onClick={() => setSelectedImage(image.url)}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
          >
            <img
              src={image.url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-white text-xs">
                {formatDate(image.date)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <XIcon size={24} />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

