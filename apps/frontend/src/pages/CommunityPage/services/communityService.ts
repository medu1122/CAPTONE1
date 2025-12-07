import axios from 'axios'
import type {
  Post,
  PostsResponse,
  CreatePostData,
  UpdatePostData,
  PostFilters,
  CreateCommentData,
  UpdateCommentData,
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
    comments: (backendPost.comments || []).map((comment: any) => {
      // Helper function to transform a single comment (recursive for replies)
      const transformComment = (c: any): Comment => ({
        _id: c._id || c.id,
        content: c.content,
        images: (c.images || []).map((img: any) => ({
          url: typeof img === 'string' ? img : (img.url || ''),
          caption: typeof img === 'object' ? (img.caption || '') : '',
        })).filter((img: any) => img.url),
        author: {
          _id: c.author?._id || c.author?.id,
          name: c.author?.name || 'Unknown',
          profileImage: c.author?.profileImage || '',
        },
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        // Recursively transform replies if they exist (always return array, never undefined)
        replies: Array.isArray(c.replies) && c.replies.length > 0
          ? c.replies.map((reply: any) => transformComment(reply))
          : [], // Always return array, even if empty
      })
      
      return transformComment(comment)
    }),
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
      console.log('🔍 [communityService] getPostById - Raw backend data:', backendData)
      console.log('🔍 [communityService] getPostById - Comments:', backendData.comments)
      if (backendData.comments && Array.isArray(backendData.comments)) {
        backendData.comments.forEach((comment: any, index: number) => {
          console.log(`🔍 [communityService] Comment ${index}:`, {
            _id: comment._id,
            content: comment.content?.substring(0, 30),
            hasReplies: !!comment.replies,
            repliesCount: comment.replies?.length || 0,
            replies: comment.replies
          })
        })
      }
      const transformedPost = transformPost(backendData)
      console.log('🔍 [communityService] getPostById - Transformed post:', transformedPost)
      console.log('🔍 [communityService] getPostById - Transformed comments:', transformedPost.comments)
      transformedPost.comments.forEach((comment: Comment, index: number) => {
        console.log(`🔍 [communityService] Transformed Comment ${index}:`, {
          _id: comment._id,
          hasReplies: !!comment.replies,
          repliesCount: comment.replies?.length || 0
        })
      })
      return transformedPost
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
      
      // Check if it's a moderation error
      if (error.response?.data?.code === 'CONTENT_MODERATION_FAILED') {
        const moderationError = new Error(error.response?.data?.message || 'Nội dung không phù hợp')
        ;(moderationError as any).code = 'CONTENT_MODERATION_FAILED'
        ;(moderationError as any).moderationData = error.response?.data?.data || {}
        throw moderationError
      }
      
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
    data: CreateCommentData | FormData,
  ): Promise<Comment> => {
    try {
      // Check if data is FormData (file upload)
      let isFormData = data instanceof FormData
      let requestData = data
      
      // If data is CreateCommentData with images (File[]), convert to FormData
      if (!isFormData && data && typeof data === 'object' && 'images' in data) {
        const commentData = data as CreateCommentData
        if (commentData.images && commentData.images.length > 0 && commentData.images[0] instanceof File) {
          const formData = new FormData()
          formData.append('content', commentData.content)
          if (commentData.parentId) {
            formData.append('parentId', commentData.parentId)
          }
          commentData.images.forEach((img) => {
            if (img instanceof File) {
              formData.append('images', img)
            }
          })
          requestData = formData
          isFormData = true
        } else if (commentData.parentId) {
          // Even without images, if parentId exists, we need to ensure it's sent
          // For JSON requests, parentId should already be in the data object
          console.log('📝 [communityService] Creating comment with parentId (no images):', commentData.parentId)
        }
      }
      
      // Log the request data to debug
      if (!isFormData && data && typeof data === 'object' && 'parentId' in data) {
        console.log('📝 [communityService] Request data (JSON):', {
          content: (data as any).content?.substring(0, 30),
          parentId: (data as any).parentId,
          hasImages: !!(data as any).images
        })
      }
      
      const config = isFormData ? {
        timeout: 60000, // 60 seconds for file upload
      } : {}
      
      const response = await api.post(
        `${API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', postId)}/comments`,
        requestData,
        config
      )
      const backendData = response.data.data || response.data
      
      // Transform the post to get properly structured comments with replies
      const post = transformPost(backendData)
      
      // Helper function to find the most recent comment (including replies)
      const findLatestComment = (comments: Comment[]): Comment | null => {
        let latest: Comment | null = null
        let latestTime = 0
        
        const checkComment = (c: Comment) => {
          const time = new Date(c.createdAt).getTime()
          if (time > latestTime) {
            latestTime = time
            latest = c
          }
          // Also check replies recursively
          if (c.replies && c.replies.length > 0) {
            c.replies.forEach(reply => checkComment(reply))
          }
        }
        
        comments.forEach(comment => checkComment(comment))
        return latest
      }
      
      // Find the most recent comment (could be a reply)
      const latestComment = findLatestComment(post.comments)
      
      if (latestComment) {
        return {
          _id: latestComment._id,
          content: latestComment.content,
          images: latestComment.images || [],
          author: latestComment.author,
          createdAt: latestComment.createdAt,
          updatedAt: latestComment.updatedAt,
          replies: latestComment.replies,
        }
      }
      
      throw new Error('No comment returned from server')
    } catch (error: any) {
      console.error('Error creating comment:', error)
      
      // Check if it's a moderation error
      if (error.response?.data?.code === 'CONTENT_MODERATION_FAILED') {
        const moderationError = new Error(error.response?.data?.message || 'Nội dung bình luận không phù hợp')
        ;(moderationError as any).code = 'CONTENT_MODERATION_FAILED'
        ;(moderationError as any).moderationData = error.response?.data?.data || {}
        throw moderationError
      }
      
      throw new Error(error.response?.data?.message || 'Failed to create comment')
    }
  },

  updateComment: async (
    postId: string,
    commentId: string,
    data: UpdateCommentData,
  ): Promise<Post> => {
    try {
      // Check if data has files (FormData)
      const isFormData = data.images && data.images.length > 0 && data.images[0] instanceof File;
      
      let response;
      if (isFormData) {
        const formData = new FormData();
        formData.append('content', data.content);
        if (data.replaceImages !== undefined) {
          formData.append('replaceImages', String(data.replaceImages));
        }
        
        // Append image files
        if (data.images) {
          data.images.forEach((img: File | { url: string; caption?: string }) => {
            if (img instanceof File) {
              formData.append('images', img);
            }
          });
        }
        
        response = await api.put(
          `${API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', postId)}/comments/${commentId}`,
          formData,
          {
            timeout: 60000, // 60 seconds for file upload
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await api.put(
          `${API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', postId)}/comments/${commentId}`,
          data
        );
      }
      
      const backendData = response.data.data || response.data
      return transformPost(backendData)
    } catch (error: any) {
      console.error('Error updating comment:', error)
      
      // Check if it's a moderation error
      if (error.response?.data?.code === 'CONTENT_MODERATION_FAILED') {
        const moderationError = new Error(error.response?.data?.message || 'Nội dung bình luận không phù hợp')
        ;(moderationError as any).code = 'CONTENT_MODERATION_FAILED'
        ;(moderationError as any).moderationData = error.response?.data?.data || {}
        throw moderationError
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update comment')
    }
  },

  deleteComment: async (
    postId: string,
    commentId: string,
  ): Promise<Post> => {
    try {
      const response = await api.delete(
        `${API_CONFIG.ENDPOINTS.POSTS.DETAIL.replace(':id', postId)}/comments/${commentId}`
      )
      const backendData = response.data.data || response.data
      return transformPost(backendData)
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete comment')
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
