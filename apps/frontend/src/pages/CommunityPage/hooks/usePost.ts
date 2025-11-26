import { useState, useEffect, useCallback } from 'react'
import { communityService } from '../services/communityService'
import { useAuth } from '../../../contexts/AuthContext'
import type {
  Post,
  PostFilters,
  CreatePostData,
  UpdatePostData,
} from '../types/community.types'
export const usePosts = (initialFilters?: PostFilters) => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PostFilters>(initialFilters || {})
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await communityService.getPosts(filters)
      setPosts(response.posts)
      setPagination({
        page: response.page,
        totalPages: response.totalPages,
        total: response.total,
      })
    } catch (err) {
      setError('Không thể tải bài viết. Vui lòng thử lại.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])
  const createPost = async (data: CreatePostData): Promise<Post | null> => {
    try {
      const newPost = await communityService.createPost(data)
      setPosts((prev) => [newPost, ...prev])
      return newPost
    } catch (err: any) {
      // Re-throw moderation errors so CreatePostModal can handle them
      if (err.code === 'CONTENT_MODERATION_FAILED') {
        throw err
      }
      setError('Không thể tạo bài viết. Vui lòng thử lại.')
      console.error(err)
      return null
    }
  }
  const updatePost = async (
    id: string,
    data: UpdatePostData,
  ): Promise<Post | null> => {
    try {
      const updatedPost = await communityService.updatePost(id, data)
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? updatedPost : post)),
      )
      return updatedPost
    } catch (err) {
      setError('Không thể cập nhật bài viết. Vui lòng thử lại.')
      console.error(err)
      return null
    }
  }
  const deletePost = async (id: string): Promise<boolean> => {
    try {
      await communityService.deletePost(id)
      setPosts((prev) => prev.filter((post) => post.id !== id))
      return true
    } catch (err) {
      setError('Không thể xóa bài viết. Vui lòng thử lại.')
      console.error(err)
      return false
    }
  }
  const likePost = async (postId: string): Promise<void> => {
    if (!user) {
      setError('Vui lòng đăng nhập để thích bài viết')
      return
    }

    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const isLiked = post.likes.includes(user.id)
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter((id) => id !== user.id)
                : [...post.likes, user.id],
            }
          }
          return post
        }),
      )
      
      // Call API
      const updatedPost = await communityService.likePost(postId)
      
      // Update with real data
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updatedPost : post))
      )
    } catch (err) {
      setError('Không thể thích bài viết. Vui lòng thử lại.')
      console.error(err)
      // Revert optimistic update
      fetchPosts()
    }
  }
  const updateFilters = (newFilters: Partial<PostFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }
  return {
    posts,
    loading,
    error,
    filters,
    pagination,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    updateFilters,
  }
}
