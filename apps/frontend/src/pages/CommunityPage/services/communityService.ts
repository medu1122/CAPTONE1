import axios from 'axios'
import type {
  Post,
  PostsResponse,
  CreatePostData,
  UpdatePostData,
  PostFilters,
  CreateCommentData,
  Comment,
} from '../types/community.types'
import API_CONFIG from '../../../config/api'
import { getAccessToken } from '../../../services/authService'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT, // Default timeout for normal requests
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // For FormData, remove Content-Type to let axios set it with boundary
  // For other requests, set JSON header
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      // Token will be cleared by authService interceptor
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Helper to transform backend Post to frontend Post
const transformPost = (backendPost: any): Post => {
  // Normalize images array - ensure each image has url property
  const normalizedImages = (backendPost.images || []).map((img: any) => {
    // If image is already an object with url, use it
    if (typeof img === 'object' && img.url) {
      return {
        url: img.url,
        caption: img.caption || '',
      }
    }
    // If image is a string (URL), convert to object
    if (typeof img === 'string') {
      return {
        url: img,
        caption: '',
      }
    }
    // Fallback: return empty object (will be filtered out)
    return null
  }).filter((img: any) => img !== null && img.url) // Filter out invalid images
  
  return {
    id: backendPost._id || backendPost.id,
    title: backendPost.title,
    content: backendPost.content,
    images: normalizedImages,
    author: {
      _id: backendPost.author?._id || backendPost.author?.id,
      name: backendPost.author?.name || 'Unknown',
      profileImage: backendPost.author?.profileImage || '',
    },
    tags: backendPost.tags || [],
    // Normalize likes: if populated, extract IDs; otherwise use as is
    likes: (backendPost.likes || []).map((like: any) => 
      typeof like === 'string' ? like : (like._id || like.id || like)
    ),
    comments: (backendPost.comments || []).map((comment: any) => ({
      _id: comment._id || comment.id,
      content: comment.content,
      author: {
        _id: comment.author?._id || comment.author?.id,
        name: comment.author?.name || 'Unknown',
        profileImage: comment.author?.profileImage || '',
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    })),
    plants: backendPost.plants || [],
    category: backendPost.category || 'discussion',
    createdAt: backendPost.createdAt,
    updatedAt: backendPost.updatedAt,
  }
}
export const communityService = {
  // Posts
  getPosts: async (filters?: PostFilters): Promise<PostsResponse> => {
    try {
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.tag) params.append('tag', filters.tag)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)

      const response = await api.get(`${API_CONFIG.ENDPOINTS.POSTS.LIST}?${params.toString()}`)
      
      const backendData = response.data.data || response.data
      
      return {
        posts: (backendData.posts || backendData || []).map(transformPost),
        total: backendData.totalItems || backendData.total || 0,
        page: backendData.currentPage || backendData.page || 1,
        totalPages: backendData.totalPages || 1,
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch posts')
    }
  },

  getPostById: async (id: string): Promise<Post> => {
    try {
      const response = await api.get(
        API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', id)
      )
      const backendData = response.data.data || response.data
      return transformPost(backendData)
    } catch (error: any) {
      console.error('Error fetching post:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch post')
    }
  },

  createPost: async (data: CreatePostData | FormData): Promise<Post> => {
    try {
      // Check if data is FormData (file upload) - need longer timeout
      const isFormData = data instanceof FormData
      
      // For file uploads, use longer timeout (60 seconds)
      // For regular JSON requests, use default timeout
      const config = isFormData ? {
        timeout: 60000, // 60 seconds for file upload
      } : {}
      
      // Axios interceptor will handle Content-Type automatically
      // For FormData, it will set multipart/form-data with boundary
      // For JSON, it will set application/json
      const response = await api.post(API_CONFIG.ENDPOINTS.POSTS.CREATE, data, config)
      const backendData = response.data.data || response.data
      return transformPost(backendData)
    } catch (error: any) {
      console.error('Error creating post:', error)
      throw new Error(error.response?.data?.message || 'Failed to create post')
    }
  },

  updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
    try {
      const response = await api.put(
        API_CONFIG.ENDPOINTS.POSTS.UPDATE.replace(':id', id),
        data
      )
      const backendData = response.data.data || response.data
      return transformPost(backendData)
    } catch (error: any) {
      console.error('Error updating post:', error)
      throw new Error(error.response?.data?.message || 'Failed to update post')
    }
  },

  deletePost: async (id: string): Promise<void> => {
    try {
      await api.delete(API_CONFIG.ENDPOINTS.POSTS.DELETE.replace(':id', id))
    } catch (error: any) {
      console.error('Error deleting post:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete post')
    }
  },

  // Comments
  createComment: async (
    postId: string,
    data: CreateCommentData,
  ): Promise<Comment> => {
    try {
      const response = await api.post(
        `${API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', postId)}/comments`,
        data
      )
      const backendData = response.data.data || response.data
      
      // Backend returns updated post with comments, extract the new comment
      if (backendData.comments && backendData.comments.length > 0) {
        const lastComment = backendData.comments[backendData.comments.length - 1]
        return {
          _id: lastComment._id || lastComment.id,
          content: lastComment.content,
          author: {
            _id: lastComment.author?._id || lastComment.author?.id,
            name: lastComment.author?.name || 'Unknown',
            profileImage: lastComment.author?.profileImage || '',
          },
          createdAt: lastComment.createdAt,
          updatedAt: lastComment.updatedAt,
        }
      }
      
      // Fallback: return from transformed post
      const post = transformPost(backendData)
      if (post.comments.length > 0) {
        const newComment = post.comments[post.comments.length - 1]
        return {
          _id: newComment._id,
          content: newComment.content,
          author: newComment.author,
          createdAt: newComment.createdAt,
          updatedAt: newComment.updatedAt,
        }
      }
      
      throw new Error('No comment returned from server')
    } catch (error: any) {
      console.error('Error creating comment:', error)
      throw new Error(error.response?.data?.message || 'Failed to create comment')
    }
  },

  // Interactions
  likePost: async (postId: string): Promise<Post> => {
    try {
      const response = await api.post(
        `${API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', postId)}/like`
      )
      const backendData = response.data.data || response.data
      return transformPost(backendData)
    } catch (error: any) {
      console.error('Error liking post:', error)
      throw new Error(error.response?.data?.message || 'Failed to like post')
    }
  },
}
