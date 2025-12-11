import React, { useState, useEffect } from 'react'
import { XIcon, FlagIcon, UploadIcon, XCircleIcon, Loader2Icon } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { uploadImage } from '../services/analysisService'

interface AnalysisReportModalProps {
  isOpen: boolean
  onClose: () => void
  analysisId?: string | null // Analysis ID (can be null for anonymous)
  originalImageUrl?: string | null // Original uploaded image URL
  onSuccess?: () => void
}

export const AnalysisReportModal: React.FC<AnalysisReportModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  originalImageUrl,
  onSuccess,
}) => {
  const [reason, setReason] = useState<'error' | 'wrong_result'>('error')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([]) // Array of uploaded image URLs
  const [uploadingImages, setUploadingImages] = useState<string[]>([]) // Array of image IDs being uploaded
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reasonLabels = {
    error: 'Lỗi',
    wrong_result: 'Kết quả sai',
  }

  // Note: originalImageUrl is kept separate from images array
  // It will be sent as originalImageUrl field, not in images array

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const maxFiles = 10 - images.length // Max 10 images total
    const filesToUpload = fileArray.slice(0, maxFiles)

    if (fileArray.length > maxFiles) {
      alert(`Chỉ có thể upload tối đa ${maxFiles} hình ảnh`)
    }

    for (const file of filesToUpload) {
      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn! Vui lòng chọn file nhỏ hơn 10MB`)
        continue
      }

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} không đúng định dạng! Chỉ chấp nhận PNG, JPG, WEBP`)
        continue
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`
      setUploadingImages((prev) => [...prev, tempId])

      try {
        const imageUrl = await uploadImage(file)
        setImages((prev) => [...prev, imageUrl])
      } catch (err: any) {
        console.error('Failed to upload image:', err)
        alert(`Không thể upload ${file.name}: ${err.message}`)
      } finally {
        setUploadingImages((prev) => prev.filter((id) => id !== tempId))
      }
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('📝 [AnalysisReportModal] Form submitted')
    setError('')

    if (!description.trim()) {
      console.log('❌ [AnalysisReportModal] Validation failed: Empty description')
      setError('Vui lòng nhập nội dung báo cáo')
      return
    }

    if (description.length < 10) {
      console.log('❌ [AnalysisReportModal] Validation failed: Description too short')
      setError('Nội dung báo cáo phải có ít nhất 10 ký tự')
      return
    }

    console.log('🔄 [AnalysisReportModal] Starting report submission...', {
      analysisId,
      reason,
      descriptionLength: description.length,
      imagesCount: images.length,
      originalImageUrl: !!originalImageUrl,
    })

    setLoading(true)
    setError('') // Clear any previous errors
    
    try {
      // Separate originalImageUrl (for analysis) from images (for showing errors)
      const reportImages = images.filter((url) => url !== originalImageUrl) // Remove original from images array
      
      const reportData = {
        type: 'analysis' as const,
        targetId: analysisId || 'anonymous', // Use 'anonymous' if no analysisId
        targetType: 'analysis' as const,
        reason,
        description: description.trim(),
        originalImageUrl: originalImageUrl || undefined, // Original image used for analysis
        images: reportImages.length > 0 ? reportImages : undefined, // Additional images showing errors/issues
      }
      
      console.log('📤 [AnalysisReportModal] Sending report data:', reportData)
      
      const result = await adminService.createReport(reportData)
      
      console.log('✅ [AnalysisReportModal] Report created successfully:', result)

      // Reset form
      setDescription('')
      setReason('error')
      setImages([]) // Clear additional images, keep originalImageUrl separate
      
      // Show success message BEFORE closing modal
      alert('✅ Báo cáo đã được gửi thành công!\n\nCảm ơn bạn đã giúp cải thiện hệ thống. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.')
      
      // Call callbacks
      console.log('🔄 [AnalysisReportModal] Calling onSuccess and onClose')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('❌ [AnalysisReportModal] Error creating report:', err)
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        stack: err.stack,
      })
      
      if (err.response?.status === 409) {
        const errorMsg = '⚠️ Bạn đã báo cáo kết quả phân tích này rồi.\n\nNếu bạn muốn cập nhật thông tin, vui lòng liên hệ admin hoặc đợi admin xử lý báo cáo trước đó.'
        setError(errorMsg)
        // Also show alert for better visibility
        alert(errorMsg)
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.'
        setError(errorMsg)
        alert(`❌ ${errorMsg}`)
      }
    } finally {
      setLoading(false)
      console.log('🏁 [AnalysisReportModal] Form submission finished, loading set to false')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FlagIcon className="text-red-600" size={24} />
            <h3 className="text-xl font-semibold">Báo cáo kết quả phân tích</h3>
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
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-red-600 text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Lỗi khi gửi báo cáo</p>
                  <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do báo cáo <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as 'error' | 'wrong_result')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {Object.entries(reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung báo cáo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết về lỗi hoặc kết quả sai..."
              rows={6}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/1000 ký tự</p>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh (tùy chọn)
            </label>
            <div className="space-y-3">
              {/* Original Image Display (Read-only) */}
              {originalImageUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh cây đã phân tích (tự động thêm)
                  </label>
                  <div className="relative inline-block">
                    <img
                      src={originalImageUrl}
                      alt="Original analysis image"
                      className="w-48 h-48 object-cover rounded-lg border-2 border-blue-300"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                      Ảnh gốc
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Đây là hình ảnh mà người dùng đã upload để phân tích
                  </p>
                </div>
              )}

              {/* Additional Images Preview Grid (for showing errors) */}
              {images.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh minh chứng lỗi/vấn đề ({images.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Error evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <XCircleIcon size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={images.length >= 10 || uploadingImages.length > 0}
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors ${
                    images.length >= 10 || uploadingImages.length > 0
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {uploadingImages.length > 0 ? (
                    <>
                      <Loader2Icon className="animate-spin text-green-600" size={20} />
                      <span className="text-sm text-gray-600">Đang upload...</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon size={20} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {images.length === 0
                          ? 'Click để upload hình ảnh'
                          : `Thêm hình ảnh (${images.length}/10)`}
                      </span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Upload hình ảnh để minh chứng lỗi hoặc vấn đề bạn gặp phải. Tối đa 10 hình ảnh. PNG, JPG, WEBP (max 10MB mỗi ảnh)
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
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
              disabled={loading || !description.trim() || description.length < 10}
              onClick={(e) => {
                console.log('🖱️ [AnalysisReportModal] Submit button clicked', {
                  loading,
                  descriptionLength: description.length,
                  disabled: loading || !description.trim() || description.length < 10,
                })
                if (!loading && description.trim() && description.length >= 10) {
                  // Let form handle submit
                } else {
                  e.preventDefault()
                  if (!description.trim()) {
                    setError('Vui lòng nhập nội dung báo cáo')
                  } else if (description.length < 10) {
                    setError('Nội dung báo cáo phải có ít nhất 10 ký tự')
                  }
                }
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2Icon className="animate-spin" size={18} />
                  Đang gửi...
                </span>
              ) : (
                'Gửi báo cáo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

