import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartIcon, MessageCircleIcon, EditIcon, TrashIcon, MoreVerticalIcon, ImageIcon, XIcon, FlagIcon } from 'lucide-react'
import type { Post, Comment, UpdateCommentData } from '../types/community.types'
import { useAuth } from '../../../contexts/AuthContext'
import { useComments } from '../hooks/useComments'
import { getAvatarUrl, getUserAvatar } from '../../../utils/avatar'
import { ModerationModal } from './ModerationModal'
import { CommentItem } from './CommentItem'
import { ReportModal } from '../../../components/ReportModal'
import { communityService } from '../services/communityService'

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentImages, setCommentImages] = useState<File[]>([])
  const [commentImagePreviews, setCommentImagePreviews] = useState<string[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [localComments, setLocalComments] = useState(post.comments)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const commentFileInputRef = useRef<HTMLInputElement>(null)
  const isManuallyUpdatingComments = useRef(false)
  
  const isAuthor = user && post.author._id === user.id

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showMenu && !target.closest('.relative')) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  // Update local comments when post changes (but skip if we're manually updating)
  useEffect(() => {
    if (!isManuallyUpdatingComments.current) {
      setLocalComments(post.comments)
    }
    // Reset the flag after a short delay to allow manual updates to complete
    if (isManuallyUpdatingComments.current) {
      setTimeout(() => {
        isManuallyUpdatingComments.current = false
      }, 100)
    }
  }, [post.comments])

  const { 
    createComment, 
    createReply, 
    updateComment,
    deleteComment,
    loading: commentLoading 
  } = useComments(post.id, {
    onCommentCreated: () => {
      onComment(post.id) // Refresh post data
    },
    onCommentUpdated: () => {
      onComment(post.id) // Refresh post data
    },
    onCommentDeleted: () => {
      onComment(post.id) // Refresh post data
    },
  })

  // Check if user has liked this post
  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.includes(user.id))
    }
  }, [user, post.likes])

  const [commentModerationError, setCommentModerationError] = useState<{
    reason: string
    issues: any[]
    suggestedContent: string | null
  } | null>(null)

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setCommentImages([file])
      const reader = new FileReader()
      reader.onloadend = () => {
        setCommentImagePreviews([reader.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCommentImage = () => {
    setCommentImages([])
    setCommentImagePreviews([])
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = ''
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return

    try {
      // Create FormData if has images
      let commentData: any
      if (commentImages.length > 0) {
        const formData = new FormData()
        formData.append('content', commentText.trim())
        commentImages.forEach((img) => {
          formData.append('images', img)
        })
        commentData = formData
      } else {
        commentData = { content: commentText.trim() }
      }

      const newComment = await createComment(commentData)
      if (newComment) {
        setCommentText('')
        setCommentImages([])
        setCommentImagePreviews([])
        setCommentModerationError(null)
        if (commentFileInputRef.current) {
          commentFileInputRef.current.value = ''
        }
        // Optimistically add comment to local state
        setLocalComments((prev: typeof post.comments) => [...prev, newComment])
      }
    } catch (error: any) {
      console.error('Error creating comment:', error)
      
      // Check if it's a moderation error
      if (error.code === 'CONTENT_MODERATION_FAILED' && error.moderationData) {
        setCommentModerationError({
          reason: error.moderationData.reason || 'Nội dung bình luận không phù hợp với cộng đồng',
          issues: error.moderationData.issues || [],
          suggestedContent: error.moderationData.suggestedContent || null,
        })
      } else {
        alert(error.message || 'Không thể thêm bình luận. Vui lòng thử lại!')
      }
    }
  }

  const handleUpdateComment = async (commentId: string, data: UpdateCommentData) => {
    try {
      await updateComment(commentId, data)
      onComment(post.id) // Refresh post data
    } catch (error: any) {
      throw error // Re-throw để CommentItem xử lý
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      onComment(post.id) // Refresh post data
    } catch (error: any) {
      throw error // Re-throw để CommentItem xử lý
    }
  }

  const handleReply = async (commentId: string, content: string, images?: File[]) => {
    try {
      console.log('📝 [PostCard] handleReply called:', { commentId, content: content.substring(0, 30) })
      await createReply(commentId, content, images)
      console.log('📝 [PostCard] createReply completed, fetching updated post...')
      // Mark that we're manually updating comments
      isManuallyUpdatingComments.current = true
      // Fetch updated post data to get the new reply
      const updatedPost = await communityService.getPostById(post.id)
      console.log('📝 [PostCard] Updated post received:', updatedPost)
      console.log('📝 [PostCard] Comments:', updatedPost.comments)
      updatedPost.comments.forEach((c: Comment, i: number) => {
        console.log(`📝 [PostCard] Comment ${i}:`, {
          _id: c._id,
          content: c.content.substring(0, 30),
          hasReplies: !!c.replies,
          repliesCount: c.replies?.length || 0,
          replies: c.replies
        })
      })
      // Update local comments immediately with the new reply
      setLocalComments(updatedPost.comments)
      console.log('📝 [PostCard] localComments updated')
      // Also notify parent to refresh (but useEffect won't overwrite because of flag)
      onComment(post.id)
    } catch (error: any) {
      isManuallyUpdatingComments.current = false
      console.error('❌ [PostCard] Error in handleReply:', error)
      throw error // Re-throw để CommentItem xử lý
    }
  }
  const getCategoryBadge = () => {
    const badges = {
      question: {
        text: 'Câu hỏi',
        color: 'bg-blue-100 text-blue-700',
      },
      discussion: {
        text: 'Thảo luận',
        color: 'bg-purple-100 text-purple-700',
      },
      tip: {
        text: 'Mẹo hay',
        color: 'bg-green-100 text-green-700',
      },
      problem: {
        text: 'Vấn đề',
        color: 'bg-red-100 text-red-700',
      },
      success: {
        text: 'Thành công',
        color: 'bg-yellow-100 text-yellow-700',
      },
    }
    const category = post.category || 'discussion'
    const badge = badges[category as keyof typeof badges]
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    )
  }
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/users/${post.author._id}`)}
            className="flex-shrink-0"
          >
            <img
              src={getAvatarUrl(post.author.profileImage)}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-green-500 transition-all cursor-pointer"
            />
          </button>
          <div className="flex-1">
            <button
              onClick={() => navigate(`/users/${post.author._id}`)}
              className="font-medium text-gray-900 hover:text-green-600 transition-colors cursor-pointer"
            >
              {post.author.name}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getTimeAgo(post.createdAt)}</span>
              <span>•</span>
              {getCategoryBadge()}
            </div>
          </div>
        </div>
        {/* Edit/Delete/Report Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVerticalIcon size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {isAuthor ? (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      onEdit?.(post)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <EditIcon size={16} />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <TrashIcon size={16} />
                    Xóa bài viết
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowReportModal(true)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FlagIcon size={16} />
                  Báo cáo bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="px-4 pb-3">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">
          {post.title}
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="px-4 pb-3">
          <div
            className={`grid ${
              post.images.length === 1
                ? 'grid-cols-1'
                : post.images.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2'
            } gap-2`}
          >
            {post.images.slice(0, 4).map((image: { url: string; caption?: string }, index: number) => (
              <div key={index} className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <img
                  src={image.url}
                  alt={image.caption || `Image ${index + 1}`}
                  className="w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load image:', image.url)
                    // Show placeholder instead of hiding
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E'
                    target.onerror = null // Prevent infinite loop
                  }}
                  // Only lazy load images after the first one
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                {image.caption && (
                  <p className="text-xs text-gray-500 mt-1 px-2">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
          {post.images.length > 4 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              +{post.images.length - 4} ảnh khác
            </p>
          )}
        </div>
      )}
      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
          <span>{post.likes.length} lượt thích</span>
          <span>{post.comments.length} bình luận</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (user) {
                onLike(post.id)
                setIsLiked(!isLiked) // Optimistic update
              }
            }}
            disabled={!user}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <HeartIcon size={20} className={isLiked ? 'fill-current' : ''} />
            <span className="font-medium">
              {isLiked ? 'Đã thích' : 'Thích'}
            </span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <MessageCircleIcon size={20} />
            <span className="font-medium">Bình luận</span>
          </button>
        </div>
      </div>
      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="mt-4 mb-4">
            <div className="flex gap-2">
              <img
                src={getUserAvatar(user as any)}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                  <input
                    ref={commentFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCommentImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => commentFileInputRef.current?.click()}
                    className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                    title="Thêm ảnh"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commentLoading || !user}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {commentLoading ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </div>
                {/* Image Preview */}
                {commentImagePreviews.length > 0 && (
                  <div className="flex gap-2">
                    {commentImagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCommentImage}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <XIcon size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
          {/* Comments List */}
          {localComments.length > 0 && (
            <div className="space-y-3">
              {localComments.map((comment: Comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={post.id}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                  onReply={handleReply}
                  onRefresh={() => onComment(post.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa bài viết
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false)
                  await onDelete?.(post.id)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Moderation Modal */}
      {commentModerationError && (
        <ModerationModal
          isOpen={!!commentModerationError}
          onClose={() => setCommentModerationError(null)}
          reason={commentModerationError.reason}
          issues={commentModerationError.issues}
          suggestedContent={commentModerationError.suggestedContent}
          originalContent={{ content: commentText }}
          onEdit={(edited) => {
            // Update comment text with edited content
            setCommentText(edited.content)
            // Close moderation modal, keep comment form open
            setCommentModerationError(null)
            // User can now edit and click submit again
          }}
          type="comment"
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="post"
        targetId={post.id}
        onSuccess={() => {
          // Refresh or show success message
        }}
      />
    </div>
  )
}
