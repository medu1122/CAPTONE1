import React, { useState, useRef } from 'react'
import { XIcon, ImageIcon, TagIcon } from 'lucide-react'
import type { CreatePostData } from '../types/community.types'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreatePostData) => Promise<void>
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] =
    useState<CreatePostData['category']>('discussion')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB!')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Frontend validation
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết')
      return
    }
    
    if (title.trim().length < 3) {
      alert('Tiêu đề phải có ít nhất 3 ký tự')
      return
    }
    
    if (title.trim().length > 200) {
      alert('Tiêu đề không được vượt quá 200 ký tự')
      return
    }
    
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết')
      return
    }
    
    if (content.trim().length < 10) {
      alert('Nội dung phải có ít nhất 10 ký tự')
      return
    }
    
    if (content.trim().length > 5000) {
      alert('Nội dung không được vượt quá 5000 ký tự')
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData to send file
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('content', content.trim())
      formData.append('category', category)
      formData.append('tags', JSON.stringify(tags))
      
      // Append image file if selected
      if (selectedImage) {
        formData.append('images', selectedImage)
      }

      // Call onSubmit with FormData
      await onSubmit(formData as any)

      // Reset form
      setTitle('')
      setContent('')
      setCategory('discussion')
      setTags([])
      setSelectedImage(null)
      setImagePreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    } catch (error: any) {
      console.error('Error creating post:', error)
      // Show more specific error message
      if (error.message?.includes('timeout')) {
        alert('Upload ảnh mất quá nhiều thời gian. Vui lòng thử lại với ảnh nhỏ hơn hoặc kiểm tra kết nối mạng.')
      } else if (error.message?.includes('Failed to upload image')) {
        alert('Không thể upload ảnh. Vui lòng thử lại với ảnh khác.')
      } else {
        alert(error.message || 'Có lỗi xảy ra khi đăng bài. Vui lòng thử lại!')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Tạo bài viết mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <XIcon size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setCategory(cat.value as CreatePostData['category'])
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === cat.value
                      ? cat.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ suy nghĩ của bạn..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon size={16} className="inline mr-1" />
              Thẻ tag
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
                placeholder="Thêm thẻ tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Thêm
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-green-900"
                    >
                      <XIcon size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon size={16} className="inline mr-1" />
              Hình ảnh (tùy chọn)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-green-600"
              >
                <ImageIcon size={20} />
                <span>Chọn ảnh từ thiết bị (tối đa 5MB)</span>
              </button>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-96 object-contain rounded-lg bg-gray-50 border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
