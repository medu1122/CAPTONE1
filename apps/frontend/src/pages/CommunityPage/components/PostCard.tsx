import React, { useState, useEffect } from 'react'
import { HeartIcon, MessageCircleIcon, CornerDownRightIcon } from 'lucide-react'
import type { Post, Comment } from '../types/community.types'
import { useAuth } from '../../../contexts/AuthContext'
import { useComments } from '../hooks/useComments'

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onComment: (postId: string) => void
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
}) => {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [localComments, setLocalComments] = useState(post.comments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  // Update local comments when post changes
  useEffect(() => {
    setLocalComments(post.comments)
  }, [post.comments])

  const { createComment, createReply, loading: commentLoading } = useComments(post.id, {
    onCommentCreated: () => {
      onComment(post.id) // Refresh post data
    },
  })

  // Check if user has liked this post
  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.includes(user.id))
    }
  }, [user, post.likes])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return

    try {
      const newComment = await createComment({ content: commentText.trim() })
      if (newComment) {
        setCommentText('')
        // Optimistically add comment to local state
        setLocalComments((prev: typeof post.comments) => [...prev, newComment])
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    const replyContent = replyText[commentId]?.trim()
    if (!replyContent || !user) return

    try {
      const newReply = await createReply(commentId, replyContent)
      if (newReply) {
        setReplyText((prev) => {
          const updated = { ...prev }
          delete updated[commentId]
          return updated
        })
        setReplyingTo(null)
        // Refresh comments to show new reply
        onComment(post.id)
      }
    } catch (error) {
      console.error('Error creating reply:', error)
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
          <img
            src={post.author.profileImage || 'https://i.pravatar.cc/150?img=0'}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900">{post.author.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getTimeAgo(post.createdAt)}</span>
              <span>•</span>
              {getCategoryBadge()}
            </div>
          </div>
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
                src={
                  (user as any)?.profileImage || 'https://i.pravatar.cc/150?img=0'
                }
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || commentLoading || !user}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {commentLoading ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          </form>
          {/* Comments List */}
          {localComments.length > 0 && (
            <div className="space-y-3">
              {localComments.map((comment: Comment) => (
                <div key={comment._id} className="space-y-2">
                  {/* Main Comment */}
                  <div className="flex gap-2">
                    <img
                      src={
                        comment.author.profileImage ||
                        'https://i.pravatar.cc/150?img=0'
                      }
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <p className="font-medium text-sm text-gray-900">
                          {comment.author.name}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 px-3">
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(comment.createdAt)}
                        </span>
                        {user && (
                          <button
                            onClick={() => {
                              setReplyingTo(replyingTo === comment._id ? null : comment._id)
                              if (replyingTo !== comment._id) {
                                setReplyText((prev) => ({
                                  ...prev,
                                  [comment._id]: '',
                                }))
                              }
                            }}
                            className="text-xs text-gray-600 hover:text-green-600 font-medium"
                          >
                            Trả lời
                          </button>
                        )}
                      </div>
                      {/* Reply Input */}
                      {replyingTo === comment._id && user && (
                        <div className="mt-2 flex gap-2">
                          <CornerDownRightIcon
                            size={16}
                            className="text-gray-400 mt-2 flex-shrink-0"
                          />
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={replyText[comment._id] || ''}
                              onChange={(e) =>
                                setReplyText((prev) => ({
                                  ...prev,
                                  [comment._id]: e.target.value,
                                }))
                              }
                              placeholder={`Trả lời ${comment.author.name}...`}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleReplySubmit(comment._id)}
                              disabled={!replyText[comment._id]?.trim() || commentLoading}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {commentLoading ? 'Đang gửi...' : 'Gửi'}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText((prev) => {
                                  const updated = { ...prev }
                                  delete updated[comment._id]
                                  return updated
                                })
                              }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                          {comment.replies.map((reply: Comment) => (
                            <div key={reply._id} className="flex gap-2">
                              <img
                                src={
                                  reply.author.profileImage ||
                                  'https://i.pravatar.cc/150?img=0'
                                }
                                alt={reply.author.name}
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1">
                                <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                  <p className="font-medium text-sm text-gray-900">
                                    {reply.author.name}
                                  </p>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {reply.content}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 px-3">
                                  <span className="text-xs text-gray-400">
                                    {getTimeAgo(reply.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
