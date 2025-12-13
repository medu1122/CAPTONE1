import React, { useState, useRef } from 'react'
import { XIcon, AlertCircleIcon, ImageIcon } from 'lucide-react'
import { adminService } from '../services/adminService'
import { imageUploadService } from '../services/imageUploadService'

interface ComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'analysis' | 'chatbot' | 'my-plants' | 'map' | 'general'
  relatedId?: string
  relatedType?: 'analysis' | 'post' | 'plant' | 'plantBox' | 'map'
  contextData?: any // Additional context data (e.g., province info, recommendation)
  onSuccess?: () => void
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  type,
  relatedId,
  relatedType,
  contextData,
  onSuccess,
}) => {
  const [category, setCategory] = useState<'error' | 'suggestion' | 'bug' | 'sai sót' | 'other'>('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const typeLabels = {
    analysis: 'Phân tích ảnh',
    chatbot: 'Chatbot',
    'my-plants': 'Vườn của tôi',
    map: 'Bản đồ',
    general: 'Tổng quát',
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh')
        return
      }

      setImages(prev => [...prev, file])
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim()) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (description.length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự')
      return
    }

    setLoading(true)
    setUploadingImages(true)
    
    try {
      // Upload images first
      const attachments = []
      if (images.length > 0) {
        for (const image of images) {
          try {
            const uploadResult = await imageUploadService.uploadImage(image, {
              folder: 'complaints'
            })
            attachments.push({
              url: uploadResult.url,
              filename: image.name,
              mimeType: image.type,
            })
          } catch (uploadError: any) {
            console.error('Error uploading image:', uploadError)
            throw new Error(`Không thể tải lên ảnh: ${uploadError.message}`)
          }
        }
      }

      const complaintData = {
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        attachments: attachments.length > 0 ? attachments : undefined,
        contextData: contextData || null,
      }
      
      const result = await adminService.createComplaint(complaintData)
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('bug')
      setImages([])
      setImagePreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi khiếu nại')
    } finally {
      setLoading(false)
      setUploadingImages(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircleIcon className="text-orange-600" size={24} />
            <h3 className="text-xl font-semibold">Gửi khiếu nại - {typeLabels[type]}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Context Data Display - Only for map type */}
          {type === 'map' && contextData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-800 mb-2">
                📍 Thông tin bạn đã chọn:
              </div>
              
              {/* Province Info */}
              {contextData.provinceName && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-medium text-gray-600 mb-1">Khu vực:</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {contextData.provinceName} ({contextData.provinceCode})
                  </div>
                </div>
              )}

              {/* Basic Info */}
              {contextData.provinceInfo && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-medium text-gray-600 mb-2">Thông tin cơ bản:</div>
                  <div className="space-y-1 text-xs text-gray-700">
                    {contextData.provinceInfo.temperature && (
                      <div>🌡️ Nhiệt độ: {contextData.provinceInfo.temperature}°C</div>
                    )}
                    {contextData.provinceInfo.weatherDescription && (
                      <div>☁️ Thời tiết: {contextData.provinceInfo.weatherDescription}</div>
                    )}
                    {contextData.provinceInfo.soilTypes && contextData.provinceInfo.soilTypes.length > 0 && (
                      <div>🌱 Loại đất: {contextData.provinceInfo.soilTypes.join(', ')}</div>
                    )}
                    {contextData.provinceInfo.currentMonth && (
                      <div>📅 Tháng: {typeof contextData.provinceInfo.currentMonth === 'object' && contextData.provinceInfo.currentMonth.month 
                        ? contextData.provinceInfo.currentMonth.month 
                        : contextData.provinceInfo.currentMonth}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {contextData.recommendation && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-medium text-gray-600 mb-2">Tư vấn mùa vụ:</div>
                  <div className="space-y-2 text-xs text-gray-700">
                    {contextData.recommendation.season && (
                      <div>
                        <div className="font-medium mb-1">📆 Mùa vụ hiện tại:</div>
                        <div className="pl-2 text-gray-600">{contextData.recommendation.season.substring(0, 150)}...</div>
                      </div>
                    )}
                    {contextData.recommendation.crops && contextData.recommendation.crops.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">🌾 Cây trồng phù hợp:</div>
                        <div className="pl-2 text-gray-600">{contextData.recommendation.crops.join(', ')}</div>
                      </div>
                    )}
                    {contextData.recommendation.harvesting && contextData.recommendation.harvesting.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">🌽 Đang thu hoạch:</div>
                        <div className="pl-2 text-gray-600">{contextData.recommendation.harvesting.join(', ')}</div>
                      </div>
                    )}
                    {contextData.recommendation.weather && (
                      <div>
                        <div className="font-medium mb-1">☁️ Đánh giá thời tiết:</div>
                        <div className="pl-2 text-gray-600">{contextData.recommendation.weather.substring(0, 150)}...</div>
                      </div>
                    )}
                    {contextData.recommendation.notes && contextData.recommendation.notes.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">💡 Lưu ý & Khuyến nghị:</div>
                        <div className="pl-2 space-y-1">
                          {contextData.recommendation.notes.slice(0, 2).map((note: any, idx: number) => (
                            <div key={idx} className="text-gray-600">
                              • {typeof note === 'string' ? note.substring(0, 100) : note.text?.substring(0, 100) || ''}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phân loại
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="bug">Bug</option>
              <option value="sai sót">Sai sót</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kết quả phân tích không chính xác"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/200 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              rows={6}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/2000 ký tự</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh (tùy chọn)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors flex items-center justify-center gap-2 text-gray-600 disabled:opacity-50"
            >
              <ImageIcon size={20} />
              <span>{uploadingImages ? 'Đang tải lên...' : 'Chọn hình ảnh'}</span>
            </button>
            
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim() || uploadingImages}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
