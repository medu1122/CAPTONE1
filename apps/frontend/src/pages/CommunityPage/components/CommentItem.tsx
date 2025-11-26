import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditIcon, TrashIcon, ImageIcon, XIcon, CornerDownRightIcon } from 'lucide-react'
import type { Comment, UpdateCommentData } from '../types/community.types'
import { useAuth } from '../../../contexts/AuthContext'
import { getAvatarUrl } from '../../../utils/avatar'
import { ModerationModal } from './ModerationModal'

interface CommentItemProps {
  comment: Comment
  postId: string
  isReply?: boolean
  onUpdate?: (commentId: string, data: UpdateCommentData) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onReply?: (commentId: string, content: string, images?: File[]) => Promise<void>
  onRefresh?: () => void
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  isReply = false,
  onUpdate,
  onDelete,
  onReply,
  onRefresh,
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [editImages, setEditImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyImages, setReplyImages] = useState<File[]>([])
  const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [moderationError, setModerationError] = useState<{
    reason: string
    issues: any[]
    suggestedContent: string | null
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replyFileInputRef = useRef<HTMLInputElement>(null)

  const isAuthor = user && comment.author._id === user.id

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes} phút trước`
    }
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} ngày trước`
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB!')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!')
        return
      }

      if (isReply) {
        setReplyImages([file])
        const reader = new FileReader()
        reader.onloadend = () => {
          setReplyImagePreviews([reader.result as string])
        }
        reader.readAsDataURL(file)
      } else {
        setEditImages([file])
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews([reader.result as string])
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleRemoveImage = (isReply: boolean = false) => {
    if (isReply) {
      setReplyImages([])
      setReplyImagePreviews([])
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = ''
      }
    } else {
      setEditImages([])
      setImagePreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(comment.content)
    setEditImages([])
    setImagePreviews([])
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
    setEditImages([])
    setImagePreviews([])
    setModerationError(null)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !onUpdate) return

    try {
      const formData = new FormData()
      formData.append('content', editContent.trim())
      if (editImages.length > 0) {
        editImages.forEach((img) => {
          formData.append('images', img)
        })
      }

      await onUpdate(comment._id, {
        content: editContent.trim(),
        images: editImages.length > 0 ? editImages : undefined,
        replaceImages: editImages.length > 0 ? 'true' : undefined,
      } as any)

      setIsEditing(false)
      setEditImages([])
      setImagePreviews([])
      setModerationError(null)
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Error updating comment:', error)
      
      if (error.code === 'CONTENT_MODERATION_FAILED' && error.moderationData) {
        setModerationError({
          reason: error.moderationData.reason || 'Nội dung bình luận không phù hợp với cộng đồng',
          issues: error.moderationData.issues || [],
          suggestedContent: error.moderationData.suggestedContent || null,
        })
      } else {
        alert(error.message || 'Không thể cập nhật bình luận. Vui lòng thử lại!')
      }
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    try {
      await onDelete(comment._id)
      setShowDeleteConfirm(false)
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      alert(error.message || 'Không thể xóa bình luận. Vui lòng thử lại!')
    }
  }

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !onReply) return

    try {
      await onReply(comment._id, replyContent.trim(), replyImages.length > 0 ? replyImages : undefined)
      setIsReplying(false)
      setReplyContent('')
      setReplyImages([])
      setReplyImagePreviews([])
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Error replying:', error)
      
      if (error.code === 'CONTENT_MODERATION_FAILED' && error.moderationData) {
        setModerationError({
          reason: error.moderationData.reason || 'Nội dung bình luận không phù hợp với cộng đồng',
          issues: error.moderationData.issues || [],
          suggestedContent: error.moderationData.suggestedContent || null,
        })
      } else {
        alert(error.message || 'Không thể thêm phản hồi. Vui lòng thử lại!')
      }
    }
  }

  return (
    <>
      <div className={`flex gap-2 ${isReply ? 'pl-4' : ''}`}>
        <button
          onClick={() => navigate(`/users/${comment.author._id}`)}
          className="flex-shrink-0"
        >
          <img
            src={getAvatarUrl(comment.author.profileImage)}
            alt={comment.author.name}
            className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full object-cover hover:ring-2 hover:ring-green-500 transition-all cursor-pointer`}
          />
        </button>
        <div className="flex-1">
          {isEditing ? (
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Chỉnh sửa bình luận..."
              />
              
              {/* Image Upload */}
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, false)}
                  className="hidden"
                />
                {imagePreviews.length === 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-600 hover:text-green-600 flex items-center gap-1"
                  >
                    <ImageIcon size={14} />
                    <span>Thêm ảnh</span>
                  </button>
                )}
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative mt-2 inline-block">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(false)}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Lưu
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
              <button
                onClick={() => navigate(`/users/${comment.author._id}`)}
                className="font-medium text-sm text-gray-900 hover:text-green-600 transition-colors cursor-pointer"
              >
                {comment.author.name}
              </button>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {comment.content}
              </p>
              
              {/* Comment Images */}
              {comment.images && comment.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {comment.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={img.caption || 'Comment image'}
                      className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-1 px-3">
            <span className="text-xs text-gray-400">
              {getTimeAgo(comment.createdAt)}
            </span>
            {!isEditing && user && (
              <>
                {isAuthor && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="text-xs text-gray-600 hover:text-green-600 font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-gray-600 hover:text-red-600 font-medium"
                    >
                      Xóa
                    </button>
                  </>
                )}
                {!isReply && onReply && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="text-xs text-gray-600 hover:text-green-600 font-medium"
                  >
                    Trả lời
                  </button>
                )}
              </>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && user && onReply && (
            <div className="mt-2 flex gap-2">
              <CornerDownRightIcon
                size={16}
                className="text-gray-400 mt-2 flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  placeholder={`Trả lời ${comment.author.name}...`}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
                  autoFocus
                />
                
                {/* Reply Image Upload */}
                <div>
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                    className="hidden"
                  />
                  {replyImagePreviews.length === 0 && (
                    <button
                      type="button"
                      onClick={() => replyFileInputRef.current?.click()}
                      className="text-xs text-gray-600 hover:text-green-600 flex items-center gap-1"
                    >
                      <ImageIcon size={14} />
                      <span>Thêm ảnh</span>
                    </button>
                  )}
                  {replyImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative mt-2 inline-block">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(true)}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim()}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Gửi
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false)
                      setReplyContent('')
                      setReplyImages([])
                      setReplyImagePreviews([])
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
              {comment.replies.map((reply: Comment) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  isReply={true}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa bình luận
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {moderationError && (
        <ModerationModal
          isOpen={!!moderationError}
          onClose={() => setModerationError(null)}
          reason={moderationError.reason}
          issues={moderationError.issues}
          suggestedContent={moderationError.suggestedContent}
          originalContent={{ content: isEditing ? editContent : replyContent }}
          onEdit={(edited) => {
            if (isEditing) {
              setEditContent(edited.content)
            } else {
              setReplyContent(edited.content)
            }
            setModerationError(null)
          }}
          type="comment"
        />
      )}
    </>
  )
}

