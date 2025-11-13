import axios from 'axios'
import { getAccessToken } from '../services/authService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

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

// Frontend types (from profile.types.ts)
export interface UserProfile {
  _id: string
  username: string
  email: string
  phone?: string
  avatar?: string
  bio?: string
  isVerified?: boolean
  address?: {
    street?: string
    province?: string
    district?: string
  }
  settings: {
    emailNotifications: boolean
    smsNotifications: boolean
    language: 'vi' | 'en'
    theme: 'light' | 'dark'
    privacy: 'public' | 'friends' | 'private'
    showEmail: boolean
    showPhone: boolean
  }
  statistics: {
    posts: number
    comments: number
    likes: number
    plants: number
  }
  professionalProfile: {
    isFarmer: boolean
    isBuyer: boolean
    farmerInfo?: {
      farmName?: string
      farmSize?: 'small' | 'medium' | 'large' | 'very-large'
      farmType?: 'organic' | 'conventional' | 'hydroponic' | 'other'
      crops?: string[]
      experience?: 'less-1' | '1-3' | '3-5' | '5-10' | 'more-10'
      certificates?: string[]
    }
    buyerInfo?: {
      preferences?: string[]
      budget?: 'low' | 'medium' | 'high' | 'very-high'
      purchaseFrequency?: 'daily' | 'weekly' | 'monthly' | 'seasonal'
    }
  }
  createdAt: string
  updatedAt: string
  joinDate?: string
  lastActiveAt?: string
}

/**
 * Transform backend profile to frontend format
 */
const transformProfile = (backendProfile: BackendUserProfile): UserProfile => {
  // Map farmSize from backend string to frontend enum
  const mapFarmSize = (size: string | null | undefined): 'small' | 'medium' | 'large' | 'very-large' | undefined => {
    if (!size) return undefined
    const sizeMap: Record<string, 'small' | 'medium' | 'large' | 'very-large'> = {
      'small': 'small',
      'medium': 'medium',
      'large': 'large',
      'very-large': 'very-large',
    }
    return sizeMap[size.toLowerCase()] || undefined
  }

  // Map farmType from backend string to frontend enum
  const mapFarmType = (type: string | null | undefined): 'organic' | 'conventional' | 'hydroponic' | 'other' | undefined => {
    if (!type) return undefined
    const typeMap: Record<string, 'organic' | 'conventional' | 'hydroponic' | 'other'> = {
      'organic': 'organic',
      'conventional': 'conventional',
      'hydroponic': 'hydroponic',
      'other': 'other',
    }
    return typeMap[type.toLowerCase()] || undefined
  }

  // Map experience from backend string to frontend enum
  const mapExperience = (exp: string | null | undefined): 'less-1' | '1-3' | '3-5' | '5-10' | 'more-10' | undefined => {
    if (!exp) return undefined
    const expMap: Record<string, 'less-1' | '1-3' | '3-5' | '5-10' | 'more-10'> = {
      'less-1': 'less-1',
      '1-3': '1-3',
      '3-5': '3-5',
      '5-10': '5-10',
      'more-10': 'more-10',
    }
    return expMap[exp.toLowerCase()] || undefined
  }

  // Map budgetRange from backend string to frontend enum
  const mapBudget = (budget: string | null | undefined): 'low' | 'medium' | 'high' | 'very-high' | undefined => {
    if (!budget) return undefined
    const budgetMap: Record<string, 'low' | 'medium' | 'high' | 'very-high'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'very-high': 'very-high',
    }
    return budgetMap[budget.toLowerCase()] || undefined
  }

  // Map purchaseFrequency from backend string to frontend enum
  const mapFrequency = (freq: string | null | undefined): 'daily' | 'weekly' | 'monthly' | 'seasonal' | undefined => {
    if (!freq) return undefined
    const freqMap: Record<string, 'daily' | 'weekly' | 'monthly' | 'seasonal'> = {
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'seasonal': 'seasonal',
    }
    return freqMap[freq.toLowerCase()] || undefined
  }

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
    professionalProfile: {
      isFarmer: !!(backendProfile.farmerProfile && (
        backendProfile.farmerProfile.farmName ||
        backendProfile.farmerProfile.farmSize ||
        backendProfile.farmerProfile.farmType ||
        (backendProfile.farmerProfile.crops && backendProfile.farmerProfile.crops.length > 0) ||
        backendProfile.farmerProfile.experience ||
        (backendProfile.farmerProfile.certifications && backendProfile.farmerProfile.certifications.length > 0)
      )),
      isBuyer: !!(backendProfile.buyerProfile && (
        (backendProfile.buyerProfile.preferences && backendProfile.buyerProfile.preferences.length > 0) ||
        backendProfile.buyerProfile.budgetRange ||
        backendProfile.buyerProfile.purchaseFrequency
      )),
      farmerInfo: backendProfile.farmerProfile ? {
        farmName: backendProfile.farmerProfile.farmName || undefined,
        farmSize: mapFarmSize(backendProfile.farmerProfile.farmSize),
        farmType: mapFarmType(backendProfile.farmerProfile.farmType),
        crops: backendProfile.farmerProfile.crops || [],
        experience: mapExperience(backendProfile.farmerProfile.experience),
        certificates: backendProfile.farmerProfile.certifications || [],
      } : undefined,
      buyerInfo: backendProfile.buyerProfile ? {
        preferences: backendProfile.buyerProfile.preferences || [],
        budget: mapBudget(backendProfile.buyerProfile.budgetRange),
        purchaseFrequency: mapFrequency(backendProfile.buyerProfile.purchaseFrequency),
      } : undefined,
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

  // Professional Profile
  if (frontendData.professionalProfile !== undefined) {
    const prof = frontendData.professionalProfile

    // Farmer Profile
    if (prof.farmerInfo !== undefined) {
      updateData.farmerProfile = {
        farmName: prof.farmerInfo.farmName || null,
        farmSize: prof.farmerInfo.farmSize || null,
        farmType: prof.farmerInfo.farmType || null,
        crops: prof.farmerInfo.crops || [],
        experience: prof.farmerInfo.experience || null,
        certifications: prof.farmerInfo.certificates || [],
      }
    } else if (prof.isFarmer === false) {
      // If user unchecks "I am a farmer", clear farmer profile
      updateData.farmerProfile = {
        farmName: null,
        farmSize: null,
        farmType: null,
        crops: [],
        experience: null,
        certifications: [],
      }
    }

    // Buyer Profile
    if (prof.buyerInfo !== undefined) {
      updateData.buyerProfile = {
        preferences: prof.buyerInfo.preferences || [],
        budgetRange: prof.buyerInfo.budget || null,
        purchaseFrequency: prof.buyerInfo.purchaseFrequency || null,
      }
    } else if (prof.isBuyer === false) {
      // If user unchecks "I am a buyer", clear buyer profile
      updateData.buyerProfile = {
        preferences: [],
        budgetRange: null,
        purchaseFrequency: null,
      }
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
}

export default profileService

