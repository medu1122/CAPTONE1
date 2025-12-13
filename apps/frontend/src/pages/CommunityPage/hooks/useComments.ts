import { useState, useCallback } from 'react'
import { communityService } from '../services/communityService'
import type { Comment, CreateCommentData, UpdateCommentData } from '../types/community.types'

interface UseCommentsOptions {
  onCommentCreated?: () => void
  onCommentUpdated?: () => void
  onCommentDeleted?: () => void
}

export const useComments = (
  postId: string,
  options?: UseCommentsOptions
) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createComment = useCallback(
    async (data: CreateCommentData): Promise<Comment | null> => {
      setLoading(true)
      setError(null)
      try {
        const newComment = await communityService.createComment(postId, data)
        // Callback to refresh post data
        if (options?.onCommentCreated) {
          options.onCommentCreated()
        }
        return newComment
      } catch (err: any) {
        setError(
          err.message || 'Không thể thêm bình luận. Vui lòng thử lại.'
        )
        throw err // Re-throw để PostCard có thể xử lý moderation error
      } finally {
        setLoading(false)
      }
    },
    [postId, options],
  )

  const createReply = useCallback(
    async (parentId: string, content: string, images?: File[]): Promise<Comment | null> => {
      setLoading(true)
      setError(null)
      try {
        const newReply = await communityService.createComment(postId, {
          content,
          parentId,
          images,
        })
        // Callback to refresh post data
        if (options?.onCommentCreated) {
          options.onCommentCreated()
        }
        return newReply
      } catch (err: any) {
        setError(
          err.message || 'Không thể thêm phản hồi. Vui lòng thử lại.'
        )
        throw err // Re-throw để PostCard có thể xử lý moderation error
      } finally {
        setLoading(false)
      }
    },
    [postId, options],
  )

  const updateComment = useCallback(
    async (commentId: string, data: UpdateCommentData): Promise<Comment | null> => {
      setLoading(true)
      setError(null)
      try {
        await communityService.updateComment(postId, commentId, data)
        // Callback to refresh post data
        if (options?.onCommentUpdated) {
          options.onCommentUpdated()
        }
        return null // Backend returns updated post, not just comment
      } catch (err: any) {
        setError(
          err.message || 'Không thể cập nhật bình luận. Vui lòng thử lại.'
        )
        throw err // Re-throw để PostCard có thể xử lý moderation error
      } finally {
        setLoading(false)
      }
    },
    [postId, options],
  )

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        await communityService.deleteComment(postId, commentId)
        // Callback to refresh post data
        if (options?.onCommentDeleted) {
          options.onCommentDeleted()
        }
      } catch (err: any) {
        setError(
          err.message || 'Không thể xóa bình luận. Vui lòng thử lại.'
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    [postId, options],
  )

  return {
    loading,
    error,
    createComment,
    createReply,
    updateComment,
    deleteComment,
  }
}
