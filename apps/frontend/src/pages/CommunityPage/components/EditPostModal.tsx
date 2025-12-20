import React, { useState, useRef, useEffect } from 'react'
import { XIcon, ImageIcon, TagIcon } from 'lucide-react'
import type { Post, UpdatePostData } from '../types/community.types'

interface EditPostModalProps {
  isOpen: boolean
  post: Post | null
  onClose: () => void
  onSubmit: (id: string, data: UpdatePostData) => Promise<void>
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  post,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<UpdatePostData['category']>('discussion')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<Array<{ url: string; caption?: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title)
      setContent(post.content)
      setCategory(post.category || 'discussion')
      setTags(post.tags || [])
      setExistingImages(post.images || [])
      setSelectedImages([])
      setImagePreviews([])
    }
  }, [post, isOpen])

  const categories = [
    {
      value: 'question',
      label: 'Câu hỏi',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      value: 'discussion',
      label: 'Thảo luận',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      value: 'tip',
      label: 'Mẹo hay',
      color: 'bg-green-100 text-green-700',
    },
    {
      value: 'problem',
      label: 'Vấn đề',
      color: 'bg-red-100 text-red-700',
    },
    {
      value: 'success',
      label: 'Thành công',
      color: 'bg-yellow-100 text-yellow-700',
    },
  ]

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + existingImages.length + selectedImages.length > 10) {
      alert('Tối đa 10 ảnh')
      return
    }

    const newImages = files.slice(0, 10 - existingImages.length - selectedImages.length)
    setSelectedImages((prev) => [...prev, ...newImages])

    // Create previews
    newImages.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setTags((prev) => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post) return

    if (!title.trim() || !content.trim()) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)
    try {
      const updateData: UpdatePostData = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        images: existingImages, // Keep existing images
      }

      // If there are new images, we need to upload them first
      // For now, we'll just update the post without new images
      // In a full implementation, you'd upload new images to Cloudinary first
      
      await onSubmit(post.id, updateData)
      onClose()
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Không thể cập nhật bài viết. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chỉnh sửa bài viết</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập tiêu đề bài viết"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Viết nội dung bài viết..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as UpdatePostData['category'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh hiện tại
              </label>
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Preview */}
          {imagePreviews.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh mới
              </label>
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Images */}
          {existingImages.length + selectedImages.length < 10 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thêm ảnh (tối đa {10 - existingImages.length - selectedImages.length} ảnh)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                <ImageIcon size={20} />
                Chọn ảnh
              </button>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thẻ (tối đa 10 thẻ)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nhập thẻ và nhấn Enter"
                disabled={tags.length >= 10}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 10 || !tagInput.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <TagIcon size={20} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="text-green-700 hover:text-green-900"
                    >
                      <XIcon size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

