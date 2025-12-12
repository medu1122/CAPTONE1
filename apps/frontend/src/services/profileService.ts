import axios from 'axios'
import { API_CONFIG } from '../config/api'
import { getAccessToken } from '../services/authService'
import type { UserProfile } from '../pages/ProfilePage/types/profile.types'

const API_BASE_URL = API_CONFIG.BASE_URL

// Backend response types
interface BackendUserProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  bio?: string | null
  profileImage?: string
  isVerified: boolean
  location?: {
    address?: string | null
    province?: string | null
    city?: string | null
    coordinates?: {
      lat?: number | null
      lng?: number | null
    }
  }
  settings?: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    language?: 'vi' | 'en'
    theme?: 'light' | 'dark'
    privacy?: {
      profileVisibility?: 'public' | 'private' | 'friends'
      showEmail?: boolean
      showPhone?: boolean
    }
  }
  stats?: {
    totalPosts?: number
    totalComments?: number
    totalLikes?: number
    totalPlants?: number
    joinDate?: string | null
    lastActiveAt?: string | null
  }
  farmerProfile?: {
    farmName?: string | null
    farmSize?: string | null
    farmType?: string | null
    crops?: string[]
    experience?: string | null
    certifications?: string[]
  }
  buyerProfile?: {
    preferences?: string[]
    budgetRange?: string | null
    purchaseFrequency?: string | null
  }
  createdAt: string
  updatedAt: string
}

// UserProfile type is imported from profile.types.ts

/**
 * Transform backend profile to frontend format
 */
const transformProfile = (backendProfile: BackendUserProfile): UserProfile => {
  return {
    _id: backendProfile.id,
    username: backendProfile.name,
    email: backendProfile.email,
    phone: backendProfile.phone || undefined,
    avatar: backendProfile.profileImage || undefined,
    bio: backendProfile.bio || undefined,
    isVerified: backendProfile.isVerified,
    address: {
      street: backendProfile.location?.address || undefined,
      province: backendProfile.location?.province || undefined,
      district: backendProfile.location?.city || undefined, // Map city to district
    },
    settings: {
      emailNotifications: backendProfile.settings?.emailNotifications ?? true,
      smsNotifications: backendProfile.settings?.smsNotifications ?? false,
      language: backendProfile.settings?.language || 'vi',
      theme: backendProfile.settings?.theme || 'light',
      privacy: backendProfile.settings?.privacy?.profileVisibility || 'public',
      showEmail: backendProfile.settings?.privacy?.showEmail ?? false,
      showPhone: backendProfile.settings?.privacy?.showPhone ?? false,
    },
    statistics: {
      posts: backendProfile.stats?.totalPosts || 0,
      comments: backendProfile.stats?.totalComments || 0,
      likes: backendProfile.stats?.totalLikes || 0,
      plants: backendProfile.stats?.totalPlants || 0,
    },
    createdAt: backendProfile.createdAt,
    updatedAt: backendProfile.updatedAt,
    joinDate: backendProfile.stats?.joinDate || undefined,
    lastActiveAt: backendProfile.stats?.lastActiveAt || undefined,
  }
}

/**
 * Transform frontend profile update to backend format
 */
const transformUpdateData = (frontendData: Partial<UserProfile>): any => {
  const updateData: any = {}

  // Basic info
  if (frontendData.username !== undefined) {
    updateData.name = frontendData.username
  }
  if (frontendData.phone !== undefined) {
    updateData.phone = frontendData.phone || null
  }
  if (frontendData.bio !== undefined) {
    updateData.bio = frontendData.bio || null
  }
  if (frontendData.avatar !== undefined) {
    updateData.profileImage = frontendData.avatar || ''
  }

  // Address
  if (frontendData.address !== undefined) {
    updateData.location = {
      address: frontendData.address.street || null,
      province: frontendData.address.province || null,
      city: frontendData.address.district || null, // Map district to city
    }
  }

  // Settings
  if (frontendData.settings !== undefined) {
    updateData.settings = {
      emailNotifications: frontendData.settings.emailNotifications,
      smsNotifications: frontendData.settings.smsNotifications,
      language: frontendData.settings.language,
      theme: frontendData.settings.theme,
      privacy: {
        profileVisibility: frontendData.settings.privacy,
        showEmail: frontendData.settings.showEmail,
        showPhone: frontendData.settings.showPhone,
      },
    }
  }


  return updateData
}

/**
 * Profile Service
 */
export const profileService = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      const token = getAccessToken()
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.data) {
        return transformProfile(response.data.data)
      }
      throw new Error(response.data.message || 'Failed to fetch profile')
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth'
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch profile')
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const token = getAccessToken()
      const updateData = transformUpdateData(data)

      const response = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.success && response.data.data) {
        return transformProfile(response.data.data)
      }
      throw new Error(response.data.message || 'Failed to update profile')
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth'
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to update profile')
    }
  },

  /**
   * Upload profile image
   */
  uploadProfileImage: async (file: File): Promise<UserProfile> => {
    try {
      const token = getAccessToken()
      const formData = new FormData()
      formData.append('image', file)

      const response = await axios.post(
        `${API_BASE_URL}/auth/profile/upload-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.data.success && response.data.data) {
        return transformProfile(response.data.data)
      }
      throw new Error(response.data.message || 'Failed to upload image')
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth'
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload image')
    }
  },

  changePassword: async (currentPassword: string, newPassword: string, verificationToken: string): Promise<void> => {
    try {
      const token = getAccessToken()
      const response = await axios.post(
        `${API_BASE_URL}/auth/profile/change-password`,
        {
          currentPassword,
          newPassword,
          verificationToken,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth'
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to change password')
    }
  },

  /**
   * Get public user profile (for viewing other users)
   */
  getPublicProfile: async (userId: string): Promise<any> => {
    try {
      const token = getAccessToken() // Optional: send token if available for privacy checks
      const headers: any = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await axios.get(`${API_BASE_URL}/auth/users/${userId}`, {
        headers,
      })

      if (response.data.success && response.data.data) {
        const backendProfile = response.data.data
        // Transform public profile (may have null email/phone)
        return {
          _id: backendProfile.id,
          username: backendProfile.name,
          email: backendProfile.email || undefined,
          phone: backendProfile.phone || undefined,
          avatar: backendProfile.profileImage || undefined,
          bio: backendProfile.bio || undefined,
          isVerified: backendProfile.isVerified,
          address: backendProfile.location ? {
            street: backendProfile.location.address || undefined,
            province: backendProfile.location.province || undefined,
            district: backendProfile.location.city || undefined,
          } : undefined,
          settings: {
            emailNotifications: false, // Not shown in public profile
            smsNotifications: false, // Not shown in public profile
            language: 'vi',
            theme: 'light',
            privacy: backendProfile.profileVisibility || 'public',
            showEmail: !!backendProfile.email,
            showPhone: !!backendProfile.phone,
          },
          statistics: {
            posts: backendProfile.stats?.totalPosts || 0,
            comments: backendProfile.stats?.totalComments || 0,
            likes: backendProfile.stats?.totalLikes || 0,
            plants: backendProfile.stats?.totalPlants || 0,
          },
          createdAt: backendProfile.createdAt,
          updatedAt: backendProfile.createdAt,
          joinDate: backendProfile.stats?.joinDate || undefined,
          profileVisibility: backendProfile.profileVisibility || 'public',
        }
      }
      throw new Error(response.data.message || 'Failed to fetch profile')
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Hồ sơ này ở chế độ riêng tư')
      }
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy người dùng')
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch profile')
    }
  },
}

export default profileService

