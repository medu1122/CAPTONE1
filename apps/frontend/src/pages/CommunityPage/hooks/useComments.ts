import { useState, useCallback } from 'react'
import { communityService } from '../services/communityService'
import type { Comment, CreateCommentData } from '../types/community.types'

interface UseCommentsOptions {
  onCommentCreated?: () => void
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
        console.error(err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [postId, options],
  )

  const createReply = useCallback(
    async (parentId: string, content: string): Promise<Comment | null> => {
      setLoading(true)
      setError(null)
      try {
        const newReply = await communityService.createComment(postId, {
          content,
          parentId,
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
        console.error(err)
        return null
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
  }
}
