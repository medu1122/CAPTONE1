import React, { useRef } from 'react'
import { CameraIcon, XIcon, Loader2Icon } from 'lucide-react'
import type { UploadedImage } from '../types'

interface UploadSectionProps {
  images: UploadedImage[]
  selectedImageId: string | null
  onFileSelect: (files: File[]) => void
  onImageSelect: (id: string) => void
  onImageRemove: (id: string) => void
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  images,
  selectedImageId,
  onFileSelect,
  onImageSelect,
  onImageRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileSelect(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">📸 Upload Ảnh</h2>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all mb-4"
      >
        <CameraIcon size={48} className="text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700 mb-1">Click để upload</p>
        <p className="text-xs text-gray-500">PNG, JPG, WEBP (max 10MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Image List */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Ảnh đã upload ({images.length})
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {images.map((image) => (
              <div
                key={image.id}
                onClick={() => onImageSelect(image.id)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageId === image.id
                    ? 'border-green-600 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <img
                  src={image.previewUrl}
                  alt="Preview"
                  className="w-full h-24 object-cover"
                />

                {/* Analyzing Overlay */}
                {image.analyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2Icon className="animate-spin text-white" size={24} />
                  </div>
                )}

                {/* Error Overlay */}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center">{image.error}</p>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onImageRemove(image.id)
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <XIcon size={14} />
                </button>

                {/* Status Badge */}
                {image.result && !image.analyzing && (
                  <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                    ✓ Đã phân tích
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

