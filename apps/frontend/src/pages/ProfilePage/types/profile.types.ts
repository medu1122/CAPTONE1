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

export interface UpdateProfileData
  extends Partial<
    Omit<UserProfile, '_id' | 'createdAt' | 'updatedAt' | 'statistics'>
  > {}
